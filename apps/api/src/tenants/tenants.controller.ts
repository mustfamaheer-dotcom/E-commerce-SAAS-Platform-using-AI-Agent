// apps/api/src/tenants/tenants.controller.ts
import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantSettingsDto } from './dto/update-tenant-settings.dto';
import { TenantContextGuard } from '../common/guards/tenant-context.guard';
import { RolesGuard, Roles } from '../common/guards/roles.guard';

@Controller('api/v1/tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post('provision')
  @HttpCode(HttpStatus.CREATED)
  async provision(@Body() dto: CreateTenantDto) {
    return this.tenantsService.provision(dto);
  }

  @Get(':slug')
  async getBySlug(@Param('slug') slug: string) {
    return this.tenantsService.findBySlug(slug);
  }

  @Patch('settings')
  @UseGuards(TenantContextGuard, RolesGuard)
  @Roles('merchant', 'admin')
  async updateSettings(@Req() req: any, @Body() dto: UpdateTenantSettingsDto) {
    const tenantId = req.tenantContext.tenantId;
    return this.tenantsService.updateSettings(tenantId, dto);
  }
}
