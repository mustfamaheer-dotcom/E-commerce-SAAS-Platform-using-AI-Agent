// apps/api/src/products/dto/query-products.dto.ts
export class QueryProductsDto {
  query?: string;
  category?: string;
  minStock?: number;
  maxPrice?: number;
  minPrice?: number;
  limit?: number = 20;
  offset?: number = 0;
}
