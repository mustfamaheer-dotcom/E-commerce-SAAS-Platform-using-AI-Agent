// apps/api/src/app.module.ts
import { Module } from '@nestjs/common';
import { TenantsModule } from './tenants/tenants.module';
import { ProductsModule } from './products/products.module';
import { InventoryModule } from './inventory/inventory.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [TenantsModule, ProductsModule, InventoryModule, AnalyticsModule],
})
export class AppModule {}
