// apps/api/src/products/products.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { QueryProductsDto } from './dto/query-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { BulkDiscountDryRunDto } from './dto/bulk-discount-dry-run.dto';
import { BulkDiscountCommitDto } from './dto/bulk-discount-commit.dto';
import { MeilisearchSyncProcessor } from '../jobs/meilisearch-sync.processor';
import { randomUUID } from 'crypto';

export interface DryRunRow {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  cost: number;
  currentPrice: number;
  proposedPrice: number;
  newNetProfitPerUnit: number;
  newMarginPct: number;
  marginWarning: boolean;
}

export interface DryRunResponse {
  actionId: string;
  status: 'PENDING_CONFIRMATION';
  filterCriteria: {
    category?: string;
    minStock?: number;
    discountPct: number;
  };
  summary: {
    totalAffectedSkus: number;
    averageMarginBeforePct: number;
    averageMarginAfterPct: number;
    negativeMarginCount: number;
  };
  previewRows: DryRunRow[];
}

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly searchSync: MeilisearchSyncProcessor,
  ) {}

  async findAll(tenantId: string, query: QueryProductsDto) {
    const queryHash = Buffer.from(JSON.stringify(query)).toString('base64');
    const cacheKey = `catalog:products:${tenantId}:${queryHash}`;

    // 1. Check Redis Cache (TTL = 60s)
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // Fallback to DB
      }
    }

    const where: any = {
      tenantId,
      isActive: true,
    };

    if (query.category) {
      where.OR = [
        { categoryId: query.category },
        { category: { name: { contains: query.category, mode: 'insensitive' } } },
      ];
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.price = {};
      if (query.minPrice !== undefined) where.price.gte = query.minPrice;
      if (query.maxPrice !== undefined) where.price.lte = query.maxPrice;
    }

    if (query.query) {
      where.AND = [
        {
          OR: [
            { name: { contains: query.query, mode: 'insensitive' } },
            { sku: { contains: query.query, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const products = await this.prisma.product.findMany({
      where,
      include: {
        inventory: true,
        category: true,
      },
      take: query.limit || 20,
      skip: query.offset || 0,
      orderBy: { createdAt: 'desc' },
    });

    const filtered = query.minStock !== undefined
      ? products.filter((p) => (p.inventory?.quantity ?? 0) >= (query.minStock ?? 0))
      : products;

    // Cache in Redis for 60 seconds
    await this.redis.set(cacheKey, JSON.stringify(filtered), 'EX', 60);

    return filtered;
  }

  async findOne(tenantId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId },
      include: { inventory: true, category: true },
    });
    if (!product) {
      throw new NotFoundException(`Product ${id} not found.`);
    }
    return product;
  }

  async update(tenantId: string, id: string, dto: UpdateProductDto) {
    const existing = await this.findOne(tenantId, id);

    const updated = await this.prisma.$transaction(async (tx) => {
      const p = await tx.product.update({
        where: { id: existing.id },
        data: {
          name: dto.name,
          price: dto.price !== undefined ? dto.price : undefined,
          cost: dto.cost !== undefined ? dto.cost : undefined,
          description: dto.description,
          categoryId: dto.categoryId,
          isActive: dto.isActive,
          metadata: dto.metadata || undefined,
        },
      });

      if (dto.stockQuantity !== undefined) {
        await tx.inventory.upsert({
          where: { productId: existing.id },
          create: {
            tenantId,
            productId: existing.id,
            quantity: dto.stockQuantity,
          },
          update: {
            quantity: dto.stockQuantity,
          },
        });
      }

      return p;
    });

    // Invalidate caches & sync search
    await this.invalidateTenantCatalogCache(tenantId);
    await this.searchSync.enqueueProductSync(tenantId, id);

    return updated;
  }

  async bulkDiscountDryRun(tenantId: string, dto: BulkDiscountDryRunDto): Promise<DryRunResponse> {
    const discount = Number(dto.discountPct);
    if (isNaN(discount) || discount <= 0 || discount > 100) {
      throw new BadRequestException('Discount percentage must be between 0 and 100.');
    }

    const where: any = { tenantId, isActive: true };

    if (dto.category) {
      where.OR = [
        { categoryId: dto.category },
        { category: { name: { contains: dto.category, mode: 'insensitive' } } },
      ];
    }

    const products = await this.prisma.product.findMany({
      where,
      include: { inventory: true, category: true },
    });

    const matchingProducts = dto.minStock !== undefined
      ? products.filter((p) => (p.inventory?.quantity ?? 0) >= (dto.minStock ?? 0))
      : products;

    let totalMarginBefore = 0;
    let totalMarginAfter = 0;
    let negativeMarginCount = 0;

    const previewRows: DryRunRow[] = matchingProducts.map((p) => {
      const currentPrice = Number(p.price);
      const cost = Number(p.cost);
      const proposedPrice = Math.round(currentPrice * (1 - discount / 100) * 100) / 100;
      const newNetProfitPerUnit = Math.round((proposedPrice - cost) * 100) / 100;
      const marginBefore = currentPrice > 0 ? ((currentPrice - cost) / currentPrice) * 100 : 0;
      const newMarginPct = proposedPrice > 0 ? Math.round(((proposedPrice - cost) / proposedPrice) * 10000) / 100 : 0;
      const marginWarning = proposedPrice < cost;

      totalMarginBefore += marginBefore;
      totalMarginAfter += newMarginPct;
      if (marginWarning) negativeMarginCount += 1;

      return {
        productId: p.id,
        sku: p.sku,
        name: p.name,
        quantity: p.inventory?.quantity ?? 0,
        cost,
        currentPrice,
        proposedPrice,
        newNetProfitPerUnit,
        newMarginPct,
        marginWarning,
      };
    });

    const totalSkus = previewRows.length;
    const actionId = `act_${randomUUID()}`;

    const dryRunResult: DryRunResponse = {
      actionId,
      status: 'PENDING_CONFIRMATION',
      filterCriteria: {
        category: dto.category,
        minStock: dto.minStock,
        discountPct: discount,
      },
      summary: {
        totalAffectedSkus: totalSkus,
        averageMarginBeforePct: totalSkus > 0 ? Math.round((totalMarginBefore / totalSkus) * 100) / 100 : 0,
        averageMarginAfterPct: totalSkus > 0 ? Math.round((totalMarginAfter / totalSkus) * 100) / 100 : 0,
        negativeMarginCount,
      },
      previewRows,
    };

    // Store in Redis (TTL = 1 hour) for audit & commit verification
    await this.redis.set(`dryrun:action:${actionId}`, JSON.stringify(dryRunResult), 'EX', 3600);

    return dryRunResult;
  }

  async bulkDiscountCommit(tenantId: string, dto: BulkDiscountCommitDto) {
    const idempotencyKey = `idempotency:action:${dto.actionId}`;

    // 1. Strict Redis Idempotency Check (TTL = 24h)
    const existingLock = await this.redis.get(idempotencyKey);
    if (existingLock) {
      this.logger.warn(`Idempotency hit: action ${dto.actionId} already executed.`);
      return JSON.parse(existingLock);
    }

    const discount = Number(dto.discountPct);
    if (isNaN(discount) || discount <= 0 || discount > 100) {
      throw new BadRequestException('Valid discount percentage required.');
    }

    const where: any = { tenantId, isActive: true };

    if (dto.category) {
      where.OR = [
        { categoryId: dto.category },
        { category: { name: { contains: dto.category, mode: 'insensitive' } } },
      ];
    }

    // 2. Atomic Prisma Transaction Execution
    const result = await this.prisma.$transaction(async (tx) => {
      const candidates = await tx.product.findMany({
        where,
        include: { inventory: true },
      });

      const eligible = dto.minStock !== undefined
        ? candidates.filter((p) => (p.inventory?.quantity ?? 0) >= (dto.minStock ?? 0))
        : candidates;

      const updatedIds: string[] = [];

      for (const product of eligible) {
        const currentPrice = Number(product.price);
        const cost = Number(product.cost);
        const newPrice = Math.round(currentPrice * (1 - discount / 100) * 100) / 100;

        if (newPrice < cost && !dto.overrideMarginWarnings) {
          this.logger.warn(`SKU ${product.sku} skipped due to negative margin floor without override`);
          continue;
        }

        await tx.product.update({
          where: { id: product.id },
          data: { price: newPrice },
        });

        updatedIds.push(product.id);
      }

      // Record in agent_actions audit log
      const audit = await tx.agentAction.create({
        data: {
          tenantId,
          action: 'bulk_update_prices',
          status: 'executed',
          payload: {
            actionId: dto.actionId,
            discountPct: discount,
            category: dto.category,
            affectedCount: updatedIds.length,
            productIds: updatedIds,
            timestamp: new Date().toISOString(),
          },
        },
      });

      return {
        actionId: dto.actionId,
        status: 'EXECUTED',
        totalUpdatedSkus: updatedIds.length,
        auditLogId: audit.id,
        executedAt: new Date().toISOString(),
      };
    });

    // 3. Store idempotency lock in Redis (24 hours)
    await this.redis.set(idempotencyKey, JSON.stringify(result), 'EX', 86400);

    // 4. Invalidate Redis Catalog Cache & Enqueue MeiliSearch Sync
    await this.invalidateTenantCatalogCache(tenantId);
    await this.searchSync.enqueueBulkSync(tenantId);

    return result;
  }

  async presignMediaUpload(tenantId: string, filename: string, mimeType: string) {
    const fileId = randomUUID();
    const cleanFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `tenants/${tenantId}/catalog/${fileId}-${cleanFilename}`;
    const uploadUrl = `https://storage.techzone-cdn.internal/upload/${storagePath}?signature=${randomUUID()}`;
    const publicUrl = `https://cdn.techzone.store/${storagePath}`;

    return {
      uploadUrl,
      publicUrl,
      fileId,
      expiresInSeconds: 900,
      headers: {
        'Content-Type': mimeType,
        'x-amz-acl': 'public-read',
      },
    };
  }

  private async invalidateTenantCatalogCache(tenantId: string) {
    // Invalidate product & alert keys
    await this.redis.del(`catalog:inventory:alerts:${tenantId}`);
  }
}
