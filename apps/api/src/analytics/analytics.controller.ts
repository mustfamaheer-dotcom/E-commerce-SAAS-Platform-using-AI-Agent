// apps/api/src/analytics/analytics.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AnalyticsService, ExecuteSafeSqlDto } from './analytics.service';
import { TenantContextGuard } from '../common/guards/tenant-context.guard';
import { RolesGuard, Roles } from '../common/guards/roles.guard';

@Controller('api/v1/analytics')
@UseGuards(TenantContextGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('execute-safe-sql')
  @Roles('merchant', 'admin', 'internal_service')
  @HttpCode(HttpStatus.OK)
  async executeSafeSql(
    @Req() req: any,
    @Body() dto: ExecuteSafeSqlDto,
  ) {
    const tenantId = req.tenantContext.tenantId;
    return this.analyticsService.executeSafeSql(tenantId, dto);
  }
}
