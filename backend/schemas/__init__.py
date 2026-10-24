# backend/schemas/__init__.py
"""Unified DTO and schema package exports."""
from backend.schemas.common import (
    ErrorDetail,
    ErrorPayload,
    StandardErrorResponse,
    PaginationParams,
    PaginatedResponse,
    StatusResponse,
)
from backend.schemas.tenant import (
    TenantDTO,
    TenantCreateDTO,
    TenantUpdateDTO,
    StoreSettingsDTO,
    ThemeConfigDTO,
)
from backend.schemas.product import (
    ProductDTO,
    ProductCreateDTO,
    ProductUpdateDTO,
    ProductVariantDTO,
    ProductFilterParams,
)
from backend.schemas.inventory import (
    InventoryItemDTO,
    InventoryAdjustDTO,
    InventoryReservationItem,
    StockoutAlertDTO,
)
from backend.schemas.cart import (
    CartItemDTO,
    CartDTO,
    AddToCartDTO,
    ApplyCouponDTO,
)
from backend.schemas.order import (
    OrderItemDTO,
    OrderDTO,
    OrderCreateDTO,
    OrderStatusUpdateDTO,
    OrderFilterParams,
    ShippingAddressDTO,
)
from backend.schemas.customer import (
    CustomerDTO,
    CustomerCreateDTO,
    CustomerFilterParams,
)
from backend.schemas.coupon import (
    CouponDTO,
    CouponCreateDTO,
    CouponValidateDTO,
    CouponValidationResultDTO,
)
from backend.schemas.ai import (
    AIQueryRequestDTO,
    AIResponseDTO,
    AIToolCallDTO,
    AIActionItemDTO,
    AIProductSummaryDTO,
    AIOrderSummaryDTO,
    AIUsageLogDTO,
)

__all__ = [
    "ErrorDetail",
    "ErrorPayload",
    "StandardErrorResponse",
    "PaginationParams",
    "PaginatedResponse",
    "StatusResponse",
    "TenantDTO",
    "TenantCreateDTO",
    "TenantUpdateDTO",
    "StoreSettingsDTO",
    "ThemeConfigDTO",
    "ProductDTO",
    "ProductCreateDTO",
    "ProductUpdateDTO",
    "ProductVariantDTO",
    "ProductFilterParams",
    "InventoryItemDTO",
    "InventoryAdjustDTO",
    "InventoryReservationItem",
    "StockoutAlertDTO",
    "CartItemDTO",
    "CartDTO",
    "AddToCartDTO",
    "ApplyCouponDTO",
    "OrderItemDTO",
    "OrderDTO",
    "OrderCreateDTO",
    "OrderStatusUpdateDTO",
    "OrderFilterParams",
    "ShippingAddressDTO",
    "CustomerDTO",
    "CustomerCreateDTO",
    "CustomerFilterParams",
    "CouponDTO",
    "CouponCreateDTO",
    "CouponValidateDTO",
    "CouponValidationResultDTO",
    "AIQueryRequestDTO",
    "AIResponseDTO",
    "AIToolCallDTO",
    "AIActionItemDTO",
    "AIProductSummaryDTO",
    "AIOrderSummaryDTO",
    "AIUsageLogDTO",
]
