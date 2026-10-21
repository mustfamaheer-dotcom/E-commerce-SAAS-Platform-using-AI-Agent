// apps/api/src/orders/orders.controller.ts
import { Body, Controller, Headers, Post } from '@nestjs/common';
import { OrdersService, CheckoutRequestDto } from './orders.service';

@Controller('api/v1')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('orders/checkout')
  async checkout(
    @Headers('x-tenant-id') tenantId: string = 'tenant-demo-01',
    @Body() dto: CheckoutRequestDto
  ) {
    return this.ordersService.checkout(tenantId, dto);
  }

  @Post('webhooks/paymob')
  async paymobWebhook(
    @Headers('hmac') hmacSignature: string,
    @Body() payload: Record<string, any>
  ) {
    return this.ordersService.handlePaymobWebhook(payload, hmacSignature);
  }
}
