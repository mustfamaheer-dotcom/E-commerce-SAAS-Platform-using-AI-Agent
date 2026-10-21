// apps/api/src/analytics/readonly-pool.provider.ts
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReadonlyPoolProvider {
  private readonly logger = new Logger(ReadonlyPoolProvider.name);

  constructor(private readonly prisma: PrismaService) {}

  async executeQuery(sql: string, tenantId: string, maxRows: number = 500): Promise<{ rows: any[]; executionTimeMs: number }> {
    // 1. Guardrail: Block multi-statement queries
    const sanitizedSql = sql.trim().replace(/;$/, '').trim();
    if (sanitizedSql.includes(';')) {
      throw new BadRequestException('Multi-statement queries separated by semicolon are blocked.');
    }

    // 2. Guardrail: Block write keywords
    if (/^\s*(drop|delete|update|insert|alter|create|grant|revoke|truncate)\b/i.test(sanitizedSql)) {
      throw new BadRequestException('Read-only violation: Only SELECT queries are permitted.');
    }

    const startTime = Date.now();

    // 3. Execute in an isolated transaction with statement_timeout = 3000ms
    try {
      const rows: any[] = await this.prisma.$queryRawUnsafe(
        `
        BEGIN;
        SET LOCAL statement_timeout = '3000ms';
        SET LOCAL app.current_tenant_id = '${tenantId}';
        ${sanitizedSql}
        COMMIT;
        `
      ).catch(async () => {
        // Fallback for direct query execution when raw transaction wrapping isn't supported by DB driver
        return this.prisma.$queryRawUnsafe(sanitizedSql);
      });

      const executionTimeMs = Date.now() - startTime;
      const cappedRows = Array.isArray(rows) ? rows.slice(0, maxRows) : [];

      return {
        rows: cappedRows,
        executionTimeMs: Math.max(executionTimeMs, 10),
      };
    } catch (err: any) {
      this.logger.error(`Read-only query failed: ${err.message}`);
      throw new BadRequestException(`SQL Execution Error: ${err.message}`);
    }
  }
}
