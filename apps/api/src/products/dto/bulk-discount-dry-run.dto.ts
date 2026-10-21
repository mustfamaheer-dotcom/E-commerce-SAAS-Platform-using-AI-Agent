// apps/api/src/products/dto/bulk-discount-dry-run.dto.ts
export class BulkDiscountDryRunDto {
  category?: string;
  minStock?: number;
  discountPct: number;
  minPrice?: number;
  maxPrice?: number;
}
