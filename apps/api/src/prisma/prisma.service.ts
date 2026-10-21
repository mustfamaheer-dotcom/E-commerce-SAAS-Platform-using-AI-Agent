// apps/api/src/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { getExtendedPrismaClient, ExtendedPrismaClient } from '@techzone/database';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  public extended!: ExtendedPrismaClient;

  async onModuleInit() {
    await this.$connect();
    this.extended = getExtendedPrismaClient(this);
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
