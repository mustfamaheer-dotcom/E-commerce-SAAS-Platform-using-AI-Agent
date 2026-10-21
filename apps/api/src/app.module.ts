// apps/api/src/app.module.ts
import { Module } from '@nestjs/common';
import { TenantsModule } from './tenants/tenants.module';

@Module({
  imports: [TenantsModule],
})
export class AppModule {}
