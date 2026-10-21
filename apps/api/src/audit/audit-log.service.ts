// apps/api/src/audit/audit-log.service.ts
import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface LogActionDto {
  userId?: string;
  toolName: string;
  params: Record<string, any>;
  status?: 'PENDING_CONFIRMATION' | 'EXECUTED' | 'REJECTED' | 'FAILED';
  errorMessage?: string;
}

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Append-only logging of an agent action.
   */
  async logAction(tenantId: string, dto: LogActionDto) {
    if (!dto.toolName) {
      throw new BadRequestException('toolName is required');
    }

    return this.prisma.agentAction.create({
      data: {
        tenantId,
        userId: dto.userId || null,
        toolName: dto.toolName,
        params: dto.params || {},
        status: dto.status || 'PENDING_CONFIRMATION',
        errorMessage: dto.errorMessage || null,
      },
    });
  }

  /**
   * Transition action status (only allows PENDING_CONFIRMATION -> EXECUTED | REJECTED | FAILED).
   */
  async updateStatus(
    tenantId: string,
    actionId: string,
    newStatus: 'EXECUTED' | 'REJECTED' | 'FAILED',
    errorMessage?: string
  ) {
    const existing = await this.prisma.agentAction.findUnique({
      where: { id: actionId },
    });

    if (!existing || existing.tenantId !== tenantId) {
      throw new NotFoundException(`Audit action ${actionId} not found`);
    }

    if (existing.status !== 'PENDING_CONFIRMATION') {
      throw new BadRequestException(
        `Action ${actionId} is already in terminal state '${existing.status}' and cannot be altered`
      );
    }

    return this.prisma.agentAction.update({
      where: { id: actionId },
      data: {
        status: newStatus,
        errorMessage: errorMessage || null,
      },
    });
  }

  /**
   * Filterable audit query strictly isolated to current tenant.
   */
  async getActions(
    tenantId: string,
    query: { status?: string; toolName?: string; limit?: number; offset?: number }
  ) {
    const limit = Math.min(query.limit || 50, 100);
    const offset = query.offset || 0;

    const where: any = { tenantId };
    if (query.status) {
      where.status = query.status;
    }
    if (query.toolName) {
      where.toolName = query.toolName;
    }

    const [items, total] = await Promise.all([
      this.prisma.agentAction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.agentAction.count({ where }),
    ]);

    return { total, limit, offset, items };
  }

  /**
   * Strict immutability: deletion is completely forbidden.
   */
  async deleteAction() {
    throw new ForbiddenException('Audit records are immutable and cannot be deleted.');
  }
}
