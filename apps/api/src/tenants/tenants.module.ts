// apps/api/src/tenants/tenants.module.ts
import { Module } from '@nestjs/common';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Module({
  controllers: [TenantsController],
  providers: [TenantsService, PrismaService, RedisService],
  exports: [TenantsService],
})
export class TenantsModule {}
