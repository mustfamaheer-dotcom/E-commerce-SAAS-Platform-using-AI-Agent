// apps/api/src/tenants/tenants.service.ts
import { Injectable, ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantSettingsDto } from './dto/update-tenant-settings.dto';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async provision(dto: CreateTenantDto) {
    this.logger.log(`Provisioning store tenant: ${dto.name} (${dto.slug})`);

    // Check slug uniqueness
    const existing = await this.prisma.tenant.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new ConflictException(`Store slug '${dto.slug}' is already taken.`);
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Create Tenant Record
      const tenant = await tx.tenant.create({
        data: {
          slug: dto.slug,
          name: dto.name,
          currency: dto.currency || 'EGP',
          theme: dto.theme || {
            mode: 'light',
            primaryColor: '#4F46E5',
            backgroundColor: '#F8FAFC',
          },
          paymentMethods: dto.paymentMethods || ['cod', 'card'],
          shippingPolicy: dto.shippingPolicy || 'Standard shipping across all governorates within 3-5 business days.',
          logoUrl: dto.logoUrl,
        },
      });

      // 2. Create Owner User
      const owner = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: dto.ownerEmail,
          role: 'merchant',
          displayName: `${dto.name} Owner`,
        },
      });

      // 3. Configure RLS helper verification
      await tx.$executeRawUnsafe(
        `SELECT setup_tenant_rls($1::uuid)`,
        tenant.id
      );

      // 4. Cache tenant config in Redis (TTL: 15 minutes)
      const cachePayload = JSON.stringify(tenant);
      await this.redis.set(`tenant:config:${tenant.id}`, cachePayload, 'EX', 900);
      await this.redis.set(`tenant:slug:${tenant.slug}`, cachePayload, 'EX', 900);

      this.logger.log(`Tenant ${tenant.slug} successfully provisioned with owner ${owner.email}`);
      return { tenant, owner };
    });
  }

  async findBySlug(slug: string) {
    const cached = await this.redis.get(`tenant:slug:${slug}`);
    if (cached) {
      return JSON.parse(cached);
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with slug '${slug}' not found.`);
    }

    await this.redis.set(`tenant:slug:${slug}`, JSON.stringify(tenant), 'EX', 900);
    return tenant;
  }

  async findById(id: string) {
    const cached = await this.redis.get(`tenant:config:${id}`);
    if (cached) {
      return JSON.parse(cached);
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID '${id}' not found.`);
    }

    await this.redis.set(`tenant:config:${id}`, JSON.stringify(tenant), 'EX', 900);
    return tenant;
  }

  async updateSettings(tenantId: string, dto: UpdateTenantSettingsDto) {
    const updated = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.currency && { currency: dto.currency }),
        ...(dto.theme && { theme: dto.theme }),
        ...(dto.paymentMethods && { paymentMethods: dto.paymentMethods }),
        ...(dto.shippingPolicy && { shippingPolicy: dto.shippingPolicy }),
        ...(dto.logoUrl && { logoUrl: dto.logoUrl }),
      },
    });

    // Invalidate caches
    await this.redis.del(`tenant:config:${tenantId}`);
    await this.redis.del(`tenant:slug:${updated.slug}`);
    await this.redis.set(`tenant:config:${tenantId}`, JSON.stringify(updated), 'EX', 900);

    return updated;
  }
}
