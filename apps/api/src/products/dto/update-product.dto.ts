// apps/api/src/products/dto/update-product.dto.ts
export class UpdateProductDto {
  name?: string;
  price?: number;
  cost?: number;
  description?: string;
  categoryId?: string;
  isActive?: boolean;
  metadata?: Record<string, any>;
  stockQuantity?: number;
}
