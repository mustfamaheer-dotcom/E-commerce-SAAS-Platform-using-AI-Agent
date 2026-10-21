// apps/api/src/integrations/integrations.module.ts
import { Module } from '@nestjs/common';
import { PaymobAdapter } from './paymob.adapter';
import { BostaAdapter } from './bosta.adapter';

@Module({
  providers: [PaymobAdapter, BostaAdapter],
  exports: [PaymobAdapter, BostaAdapter],
})
export class IntegrationsModule {}
