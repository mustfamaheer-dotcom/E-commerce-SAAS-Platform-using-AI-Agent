// apps/api/src/inventory/inventory.module.ts
import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Module({
  controllers: [InventoryController],
  providers: [InventoryService, PrismaService, RedisService],
  exports: [InventoryService],
})
export class InventoryModule {}
