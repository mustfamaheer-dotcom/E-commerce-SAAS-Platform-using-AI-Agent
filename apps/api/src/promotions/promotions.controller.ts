// apps/api/src/promotions/promotions.controller.ts
import { Body, Controller, Get, Headers, Post, Query } from '@nestjs/common';
import { PromotionsService, CreatePromotionDto } from './promotions.service';

@Controller('api/v1/promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Get()
  async getPromotions(@Headers('x-tenant-id') tenantId: string = 'tenant-demo-01') {
    return this.promotionsService.listPromotions(tenantId);
  }

  @Post()
  async createPromotion(
    @Headers('x-tenant-id') tenantId: string = 'tenant-demo-01',
    @Body() dto: CreatePromotionDto
  ) {
    return this.promotionsService.createSegmentPromotion(tenantId, dto);
  }

  @Post('validate')
  async validateCoupon(
    @Headers('x-tenant-id') tenantId: string = 'tenant-demo-01',
    @Body() body: { code: string; cartTotal: number; customerId?: string }
  ) {
    return this.promotionsService.validateAndApplyCoupon(
      tenantId,
      body.customerId || null,
      body.code,
      body.cartTotal
    );
  }
}
