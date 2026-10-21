// apps/api/src/tenants/dto/create-tenant.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsArray, IsEnum, Matches } from 'class-validator';

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'slug can only contain lowercase letters, numbers, and hyphens',
  })
  slug!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  @IsEnum(['EGP', 'USD', 'SAR'])
  currency: string = 'EGP';

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
  @IsNotEmpty()
  ownerEmail!: string;

  @IsString()
  @IsOptional()
  logoUrl?: string;
}
