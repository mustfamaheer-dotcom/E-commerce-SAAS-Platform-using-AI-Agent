// apps/api/src/analytics/analytics.service.ts
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { ReadonlyPoolProvider } from './readonly-pool.provider';
import { createHash } from 'crypto';

export interface ExecuteSafeSqlDto {
  sql: string;
  params?: Record<string, any>;
  preferred_chart?: 'auto' | 'bar' | 'line' | 'pie' | 'table' | 'kpi';
}

export interface SqlExecutionResponse {
  columns: string[];
  rows: any[];
  row_count: number;
  execution_time_ms: number;
  cached: boolean;
  chart_hint: string;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly redis: RedisService,
    private readonly readonlyPool: ReadonlyPoolProvider,
  ) {}

  async executeSafeSql(
    tenantId: string,
    dto: ExecuteSafeSqlDto,
  ): Promise<SqlExecutionResponse> {
    const rawSql = dto.sql.trim();
    if (!rawSql) {
      throw new BadRequestException('SQL query string cannot be empty.');
    }

    // 1. Generate normalized hash for Redis Query Caching (TTL = 300s / 5 min)
    const sqlHash = createHash('sha256').update(rawSql.toLowerCase()).digest('hex').slice(0, 16);
    const cacheKey = `bi:query:${tenantId}:${sqlHash}`;

    const cached = await this.redis.get(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        return {
          ...parsed,
          cached: true,
        };
      } catch {
        // Fallback to fresh execution
      }
    }

    // 2. Execute on Read-Only connection pool with statement timeout & 500-row cap
    const { rows, executionTimeMs } = await this.readonlyPool.executeQuery(
      rawSql,
      tenantId,
      500,
    );

    // 3. Extract columns
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

    // 4. Auto-detect chart hint
    const chartHint = this.inferChartType(columns, rows, dto.preferred_chart);

    const response: SqlExecutionResponse = {
      columns,
      rows,
      row_count: rows.length,
      execution_time_ms: executionTimeMs,
      cached: false,
      chart_hint: chartHint,
    };

    // 5. Cache result in Redis for 5 minutes
    await this.redis.set(cacheKey, JSON.stringify(response), 'EX', 300);

    return response;
  }

  private inferChartType(
    columns: string[],
    rows: any[],
    preferred: string = 'auto',
  ): string {
    if (preferred !== 'auto' && ['bar', 'line', 'pie', 'table', 'kpi'].includes(preferred)) {
      return preferred;
    }

    if (rows.length === 1 && columns.length <= 2) {
      return 'kpi';
    }

    const colLower = columns.map((c) => c.toLowerCase());
    const hasDate = colLower.some((c) =>
      ['date', 'day', 'month', 'order_date', 'order_day', 'report_date'].includes(c),
    );
    const hasCategory = colLower.some((c) =>
      ['category', 'category_name', 'city', 'product_name', 'segment'].includes(c),
    );

    if (hasDate && rows.length > 1) return 'line';
    if (hasCategory && rows.length <= 6 && colLower.some((c) => c.includes('share'))) return 'pie';
    if (hasCategory) return 'bar';

    return 'table';
  }
}
