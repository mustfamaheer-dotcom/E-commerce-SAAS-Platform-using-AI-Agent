// apps/api/src/orders/orders.service.ts
import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PromotionsService } from '../promotions/promotions.service';
import { PaymobAdapter } from '../integrations/paymob.adapter';
import { BostaAdapter } from '../integrations/bosta.adapter';

export interface CheckoutItemDto {
  productId: string;
  quantity: number;
}

export interface CheckoutRequestDto {
  customerId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  city: string;
  streetAddress: string;
  promoCode?: string;
  paymentMethod: 'CARD' | 'INSTAPAY' | 'FAWRY';
  items: CheckoutItemDto[];
}

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly promotionsService: PromotionsService,
    private readonly paymobAdapter: PaymobAdapter,
    private readonly bostaAdapter: BostaAdapter
  ) {}

  async checkout(tenantId: string, dto: CheckoutRequestDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order items cannot be empty');
    }

    // 1. Fetch products and check stock availability
    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { tenantId, id: { in: productIds } },
      include: { inventory: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    let rawSubtotal = 0;
    const itemsToCreate: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
      discount: number;
    }> = [];

    for (const item of dto.items) {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new NotFoundException(`Product ${item.productId} not found`);
      }
      if (product.inventory && product.inventory.quantity < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for '${product.name}'. In stock: ${product.inventory.quantity}, requested: ${item.quantity}`
        );
      }

      const price = Number(product.price);
      rawSubtotal += price * item.quantity;
      itemsToCreate.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: price,
        discount: 0,
      });
    }

    // 2. Apply promo discount if present
    let finalTotal = rawSubtotal;
    let promoDiscountPct = 0;
    if (dto.promoCode) {
      const promoResult = await this.promotionsService.validateAndApplyCoupon(
        tenantId,
        dto.customerId || null,
        dto.promoCode,
        rawSubtotal
      );
      finalTotal = promoResult.finalTotal;
      promoDiscountPct = promoResult.discountPct;
    }

    // 3. Atomically deduct inventory and create order & line items in a transaction
    const order = await this.prisma.$transaction(async (tx) => {
      // Deduct inventory
      for (const item of dto.items) {
        await tx.inventory.updateMany({
          where: { tenantId, productId: item.productId },
          data: { quantity: { decrement: item.quantity } },
        });
      }

      // Upsert customer if needed
      let customerId = dto.customerId;
      if (!customerId && dto.customerEmail) {
        const existing = await tx.customer.findFirst({
          where: { tenantId, email: dto.customerEmail },
        });
        if (existing) {
          customerId = existing.id;
        } else {
          const newCust = await tx.customer.create({
            data: {
              tenantId,
              name: dto.customerName,
              email: dto.customerEmail,
              phone: dto.customerPhone || null,
              city: dto.city || 'Cairo',
              rfmSegment: 'New Customers',
            },
          });
          customerId = newCust.id;
        }
      }

      // Create Order
      return tx.order.create({
        data: {
          tenantId,
          customerId,
          status: 'PENDING',
          total: finalTotal,
          currency: 'EGP',
          paymentRef: `PAYMOB-INIT-${Date.now()}`,
          items: {
            create: itemsToCreate.map((it) => ({
              productId: it.productId,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              discount: promoDiscountPct / 100,
            })),
          },
        },
        include: { items: true },
      });
    });

    // 4. Initiate Paymob Payment Intention
    const paymobResult = await this.paymobAdapter.createPaymentIntention({
      amountCents: Math.round(finalTotal * 100),
      currency: 'EGP',
      paymentMethods: [dto.paymentMethod],
      billingData: {
        firstName: dto.customerName.split(' ')[0] || 'Customer',
        lastName: dto.customerName.split(' ').slice(1).join(' ') || 'Customer',
        email: dto.customerEmail,
        phoneNumber: dto.customerPhone || '+201000000000',
        city: dto.city,
        country: 'EG',
      },
      merchantOrderId: order.id,
    });

    return {
      orderId: order.id,
      status: order.status,
      subtotal: rawSubtotal,
      discountApplied: rawSubtotal - finalTotal,
      finalTotal,
      currency: 'EGP',
      payment: paymobResult,
    };
  }

  async handlePaymobWebhook(payload: Record<string, any>, signature: string) {
    const isValid = this.paymobAdapter.verifyWebhookSignature(payload, signature);
    if (!isValid) {
      throw new BadRequestException('Invalid Paymob HMAC signature');
    }

    const orderId = payload?.obj?.order?.merchant_order_id || payload?.order_id || payload?.order?.id;
    if (!orderId) {
      throw new BadRequestException('Missing order identifier in webhook payload');
    }

    const isSuccess = payload?.obj?.success !== false;
    if (!isSuccess) {
      this.logger.warn(`Paymob payment declined for order ${orderId}`);
      return { status: 'DECLINED' };
    }

    // 1. Transition Order status to PAID
    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'PAID',
        paymentRef: `PAYMOB-TXN-${payload?.obj?.id || Date.now()}`,
      },
      include: { customer: true },
    });

    // 2. Automatically generate Bosta Shipping Waybill
    const waybill = await this.bostaAdapter.createWaybill({
      receiverName: order.customer?.name || 'Customer',
      receiverPhone: order.customer?.phone || '+201000000000',
      city: order.customer?.city || 'Cairo',
      streetAddress: '15 Tahrir St',
      orderReference: order.id,
    });

    // 3. Persist shipping AWB to Order
    await this.prisma.order.update({
      where: { id: order.id },
      data: { shippingAwB: waybill.shippingAwb },
    });

    return {
      status: 'PROCESSED',
      orderId: order.id,
      orderStatus: 'PAID',
      shippingAwb: waybill.shippingAwb,
    };
  }
}
