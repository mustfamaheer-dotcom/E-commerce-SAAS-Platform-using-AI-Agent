// apps/api/src/tenants/dto/update-tenant-settings.dto.ts
import { IsString, IsOptional, IsArray, IsEnum } from 'class-validator';

export class UpdateTenantSettingsDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  @IsEnum(['EGP', 'USD', 'SAR'])
  currency?: string;

  @IsOptional()
  theme?: {
    mode: 'light' | 'dark';
    primaryColor: string;
    backgroundColor?: string;
  };

  @IsArray()
  @IsOptional()
  paymentMethods?: string[];

  @IsString()
  @IsOptional()
  shippingPolicy?: string;

  @IsString()
  @IsOptional()
  logoUrl?: string;
}
