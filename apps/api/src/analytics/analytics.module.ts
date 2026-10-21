// apps/api/src/analytics/analytics.module.ts
import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { ReadonlyPoolProvider } from './readonly-pool.provider';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService, ReadonlyPoolProvider, PrismaService, RedisService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
