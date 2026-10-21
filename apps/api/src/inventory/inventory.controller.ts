// apps/api/src/inventory/inventory.controller.ts
import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { TenantContextGuard } from '../common/guards/tenant-context.guard';
import { RolesGuard, Roles } from '../common/guards/roles.guard';

@Controller('api/v1/inventory')
@UseGuards(TenantContextGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('alerts')
  @Roles('merchant', 'admin', 'internal_service')
  async getAlerts(@Req() req: any) {
    const tenantId = req.tenantContext.tenantId;
    return this.inventoryService.getInventoryAlerts(tenantId);
  }
}
