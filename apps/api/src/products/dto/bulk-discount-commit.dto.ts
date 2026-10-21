// apps/api/src/products/dto/bulk-discount-commit.dto.ts
export class BulkDiscountCommitDto {
  actionId: string;
  category?: string;
  minStock?: number;
  discountPct: number;
  overrideMarginWarnings?: boolean = false;
}
