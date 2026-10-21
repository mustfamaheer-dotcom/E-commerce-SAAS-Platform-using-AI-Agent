// apps/api/src/inventory/inventory.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

export interface InventoryAlertItem {
  productId: string;
  sku: string;
  productName: string;
  categoryName?: string;
  currentStock: number;
  reorderLevel: number;
  daysUntilStockout: number;
  urgency: 'CRITICAL' | 'WARNING' | 'HEALTHY';
  unitCost: number;
  unitPrice: number;
  dailyProfitAtRisk: number;
  recommendedReorderQty: number;
}

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getInventoryAlerts(tenantId: string): Promise<InventoryAlertItem[]> {
    const cacheKey = `catalog:inventory:alerts:${tenantId}`;

    // 1. Check Redis Cache (TTL = 60s)
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // Fallback
      }
    }

    // 2. Fetch inventory joined with products and recent sales velocity
    const items = await this.prisma.inventory.findMany({
      where: {
        tenantId,
        product: { isActive: true },
      },
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
    });

    const alerts: InventoryAlertItem[] = [];

    for (const inv of items) {
      const p = inv.product;
      const currentStock = inv.quantity;
      const reorderLevel = inv.reorderLevel;
      const price = Number(p.price);
      const cost = Number(p.cost);
      const margin = Math.max(0, price - cost);

      // Estimate demand velocity (default fallback 2.5 units/day or from order_items)
      const estimatedDailyDemand = 2.5;
      const daysUntilStockout = Math.max(0, Math.round((currentStock / estimatedDailyDemand) * 10) / 10);
      const dailyProfitAtRisk = Math.round(estimatedDailyDemand * margin * 100) / 100;

      let urgency: 'CRITICAL' | 'WARNING' | 'HEALTHY' = 'HEALTHY';
      if (currentStock <= 5 || daysUntilStockout <= 2) {
        urgency = 'CRITICAL';
      } else if (currentStock <= reorderLevel || daysUntilStockout <= 7) {
        urgency = 'WARNING';
      }

      // Recommend reorder quantity to cover 30 days lead + safety stock
      const recommendedReorderQty = Math.max(20, Math.round(estimatedDailyDemand * 30 + reorderLevel - currentStock));

      if (urgency !== 'HEALTHY') {
        alerts.push({
          productId: p.id,
          sku: p.sku,
          productName: p.name,
          categoryName: p.category?.name || 'General',
          currentStock,
          reorderLevel,
          daysUntilStockout,
          urgency,
          unitCost: cost,
          unitPrice: price,
          dailyProfitAtRisk,
          recommendedReorderQty,
        });
      }
    }

    // Sort by Daily Profit at Risk descending so highest financial impact comes first
    alerts.sort((a, b) => b.dailyProfitAtRisk - a.dailyProfitAtRisk);

    // Cache in Redis for 60s
    await this.redis.set(cacheKey, JSON.stringify(alerts), 'EX', 60);

    return alerts;
  }
}
