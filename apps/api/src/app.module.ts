// apps/api/src/app.module.ts
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { TenantsModule } from './tenants/tenants.module';
import { ProductsModule } from './products/products.module';
import { InventoryModule } from './inventory/inventory.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { PromotionsModule } from './promotions/promotions.module';
import { OrdersModule } from './orders/orders.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { AuditLogModule } from './audit/audit-log.module';
import { PromptGuardMiddleware } from './security/prompt-guard.middleware';

@Module({
  imports: [
    TenantsModule,
    ProductsModule,
    InventoryModule,
    AnalyticsModule,
    PromotionsModule,
    OrdersModule,
    IntegrationsModule,
    AuditLogModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(PromptGuardMiddleware).forRoutes('*');
  }
}
