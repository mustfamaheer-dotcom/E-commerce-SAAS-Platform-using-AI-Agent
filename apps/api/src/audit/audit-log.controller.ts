// apps/api/src/audit/audit-log.controller.ts
import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query } from '@nestjs/common';
import { AuditLogService, LogActionDto } from './audit-log.service';

@Controller('api/v1/audit')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get('actions')
  async getActions(
    @Headers('x-tenant-id') tenantId: string = 'tenant-demo-01',
    @Query('status') status?: string,
    @Query('toolName') toolName?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ) {
    return this.auditLogService.getActions(tenantId, {
      status,
      toolName,
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0,
    });
  }

  @Post('log-action')
  async logAction(
    @Headers('x-tenant-id') tenantId: string = 'tenant-demo-01',
    @Body() dto: LogActionDto
  ) {
    return this.auditLogService.logAction(tenantId, dto);
  }

  @Patch('actions/:id/status')
  async updateStatus(
    @Headers('x-tenant-id') tenantId: string = 'tenant-demo-01',
    @Param('id') actionId: string,
    @Body() body: { status: 'EXECUTED' | 'REJECTED' | 'FAILED'; errorMessage?: string }
  ) {
    return this.auditLogService.updateStatus(tenantId, actionId, body.status, body.errorMessage);
  }

  @Delete('actions/:id')
  async deleteAction() {
    return this.auditLogService.deleteAction();
  }
}
