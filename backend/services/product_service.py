# backend/services/product_service.py
"""Tenant-scoped Product & Catalog Service."""
import uuid
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.models.product import Product, ProductVariant
from backend.models.category import Category
from backend.schemas.product import ProductCreateDTO, ProductUpdateDTO, ProductFilterParams
from backend.core.errors import EntityNotFoundException, ValidationException


class ProductService:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, tenant_id: str, product_id: str) -> Product:
        prod = self.db.query(Product).filter_by(tenant_id=tenant_id, id=product_id).first()
        if not prod:
            raise EntityNotFoundException("Product", product_id)
        return prod

    def get_by_sku(self, tenant_id: str, sku: str) -> Optional[Product]:
        return self.db.query(Product).filter_by(tenant_id=tenant_id, sku=sku).first()

    def list_products(
        self,
        tenant_id: str,
        filters: Optional[ProductFilterParams] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[Product], int]:
        """Lists products strictly scoped to tenant_id with filtering and pagination."""
        query = self.db.query(Product).filter(Product.tenant_id == tenant_id)

        if filters:
            if filters.is_active is not None:
                query = query.filter(Product.is_active == filters.is_active)
            if filters.category_id:
                query = query.filter(Product.category_id == filters.category_id)
            if filters.featured is not None:
                query = query.filter(Product.featured == filters.featured)
            if filters.min_price is not None:
                query = query.filter(Product.price >= filters.min_price)
            if filters.max_price is not None:
                query = query.filter(Product.price <= filters.max_price)
            if filters.min_stock is not None:
                query = query.filter(Product.stock_qty >= filters.min_stock)
            if filters.search:
                term = f"%{filters.search}%"
                query = query.filter(
                    (Product.name_ar.ilike(term)) |
                    (Product.name_en.ilike(term)) |
                    (Product.sku.ilike(term))
                )

        total = query.count()
        offset = (page - 1) * page_size
        items = query.order_by(Product.created_at.desc()).offset(offset).limit(page_size).all()
        return items, total

    def create_product(self, tenant_id: str, dto: ProductCreateDTO) -> Product:
        """Creates a new product scoped to tenant_id."""
        sku = dto.sku or f"SKU-{uuid.uuid4().hex[:6].upper()}"

        existing = self.get_by_sku(tenant_id, sku)
        if existing:
            raise ValidationException(f"SKU '{sku}' already exists in your store catalog.")

        if dto.category_id:
            cat = self.db.query(Category).filter_by(tenant_id=tenant_id, id=dto.category_id).first()
            if not cat:
                raise EntityNotFoundException("Category", dto.category_id)

        prod_id = f"prod_{uuid.uuid4().hex[:10]}"
        slug = f"prod-{uuid.uuid4().hex[:8]}"

        prod = Product(
            id=prod_id,
            tenant_id=tenant_id,
            category_id=dto.category_id,
            name_ar=dto.name_ar,
            name_en=dto.name_en or dto.name_ar,
            slug=slug,
            price=dto.price,
            cost_price=dto.cost_price,
            compare_price=dto.compare_price,
            sku=sku,
            stock_qty=dto.stock_qty,
            low_stock_threshold=dto.low_stock_threshold,
            images=dto.images,
            attributes=dto.attributes,
            featured=dto.featured,
            is_active=True,
            description_ar=dto.description_ar,
            description_en=dto.description_en,
        )
        self.db.add(prod)
        self.db.commit()
        self.db.refresh(prod)
        return prod

    def update_product(self, tenant_id: str, product_id: str, dto: ProductUpdateDTO) -> Product:
        """Updates product properties."""
        prod = self.get_by_id(tenant_id, product_id)

        update_data = dto.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            if hasattr(prod, key):
                setattr(prod, key, value)

        self.db.commit()
        self.db.refresh(prod)
        return prod

    def deactivate_product(self, tenant_id: str, product_id: str) -> None:
        """Soft-deletes / deactivates product."""
        prod = self.get_by_id(tenant_id, product_id)
        prod.is_active = False
        self.db.commit()
