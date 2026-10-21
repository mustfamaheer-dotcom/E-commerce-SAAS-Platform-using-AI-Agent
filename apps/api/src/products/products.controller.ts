// apps/api/src/products/products.controller.ts
import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { QueryProductsDto } from './dto/query-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { BulkDiscountDryRunDto } from './dto/bulk-discount-dry-run.dto';
import { BulkDiscountCommitDto } from './dto/bulk-discount-commit.dto';
import { TenantContextGuard } from '../common/guards/tenant-context.guard';
import { RolesGuard, Roles } from '../common/guards/roles.guard';

@Controller('api/v1/products')
@UseGuards(TenantContextGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @Roles('merchant', 'admin', 'customer', 'internal_service')
  async findAll(@Req() req: any, @Query() query: QueryProductsDto) {
    const tenantId = req.tenantContext.tenantId;
    return this.productsService.findAll(tenantId, query);
  }

  @Get(':id')
  @Roles('merchant', 'admin', 'customer', 'internal_service')
  async findOne(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.tenantContext.tenantId;
    return this.productsService.findOne(tenantId, id);
  }

  @Patch(':id')
  @Roles('merchant', 'admin')
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    const tenantId = req.tenantContext.tenantId;
    return this.productsService.update(tenantId, id, dto);
  }

  @Post('bulk-discount/dry-run')
  @Roles('merchant', 'admin', 'internal_service')
  @HttpCode(HttpStatus.OK)
  async bulkDiscountDryRun(
    @Req() req: any,
    @Body() dto: BulkDiscountDryRunDto,
  ) {
    const tenantId = req.tenantContext.tenantId;
    return this.productsService.bulkDiscountDryRun(tenantId, dto);
  }

  @Post('bulk-discount/commit')
  @Roles('merchant', 'admin', 'internal_service')
  @HttpCode(HttpStatus.OK)
  async bulkDiscountCommit(
    @Req() req: any,
    @Body() dto: BulkDiscountCommitDto,
  ) {
    const tenantId = req.tenantContext.tenantId;
    return this.productsService.bulkDiscountCommit(tenantId, dto);
  }

  @Post('media/presign')
  @Roles('merchant', 'admin')
  @HttpCode(HttpStatus.OK)
  async presignMedia(
    @Req() req: any,
    @Body() body: { filename: string; mimeType: string },
  ) {
    const tenantId = req.tenantContext.tenantId;
    return this.productsService.presignMediaUpload(
      tenantId,
      body.filename || 'image.png',
      body.mimeType || 'image/png',
    );
  }
}
