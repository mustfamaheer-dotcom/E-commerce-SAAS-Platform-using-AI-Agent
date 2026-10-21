// apps/api/src/products/products.module.ts
import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { MeilisearchSyncProcessor } from '../jobs/meilisearch-sync.processor';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, PrismaService, RedisService, MeilisearchSyncProcessor],
  exports: [ProductsService],
})
export class ProductsModule {}
