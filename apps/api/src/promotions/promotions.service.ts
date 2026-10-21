// apps/api/src/promotions/promotions.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreatePromotionDto {
  code: string;
  name?: string;
  targetSegment?: string;
  discountPct: number;
  durationDays?: number;
}

export interface CouponValidationResult {
  valid: boolean;
  code: string;
  discountPct: number;
  originalTotal: number;
  discountAmount: number;
  finalTotal: number;
  message: string;
}

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  async validateAndApplyCoupon(
    tenantId: string,
    customerId: string | null,
    code: string,
    cartTotal: number
  ): Promise<CouponValidationResult> {
    const promo = await this.prisma.promotion.findFirst({
      where: {
        tenantId,
        code: code.toUpperCase().trim(),
        isActive: true,
      },
    });

    if (!promo) {
      throw new NotFoundException(`Coupon code '${code}' is invalid or expired`);
    }

    const now = new Date();
    if (now < promo.startsAt || now > promo.endsAt) {
      throw new BadRequestException(`Coupon code '${code}' is outside of its active validity window`);
    }

    // Verify segment targeting if promo is segment-scoped and customerId is supplied
    if (promo.targetSegment && promo.targetSegment !== 'ALL' && customerId) {
      const customer = await this.prisma.customer.findUnique({
        where: { id: customerId },
      });
      if (customer && customer.rfmSegment && customer.rfmSegment !== promo.targetSegment) {
        throw new BadRequestException(
          `Coupon '${code}' is exclusive to '${promo.targetSegment}' customers.`
        );
      }
    }

    const discountPct = Number(promo.discountPct);
    const discountAmount = Number(((cartTotal * discountPct) / 100).toFixed(2));
    const finalTotal = Math.max(0, Number((cartTotal - discountAmount).toFixed(2)));

    return {
      valid: true,
      code: promo.code,
      discountPct,
      originalTotal: cartTotal,
      discountAmount,
      finalTotal,
      message: `Coupon '${promo.code}' applied successfully (-${discountPct}%)`,
    };
  }

  async createSegmentPromotion(tenantId: string, dto: CreatePromotionDto) {
    if (dto.discountPct <= 0 || dto.discountPct > 50) {
      throw new BadRequestException('Discount percentage must be between 1% and 50%');
    }

    const code = (dto.code || `PROMO-${Math.floor(1000 + Math.random() * 9000)}`).toUpperCase().trim();
    const durationDays = dto.durationDays || 7;
    const startsAt = new Date();
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + durationDays);

    return this.prisma.promotion.create({
      data: {
        tenantId,
        code,
        name: dto.name || `${dto.targetSegment || 'All'} Promo - ${dto.discountPct}%`,
        targetSegment: dto.targetSegment || 'ALL',
        discountPct: dto.discountPct,
        startsAt,
        endsAt,
        isActive: true,
      },
    });
  }

  async listPromotions(tenantId: string) {
    return this.prisma.promotion.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
