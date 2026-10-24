# backend/schemas/common.py
"""Standard DTOs, pagination, and unified error response schemas."""
from typing import Any, Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field

T = TypeVar("T")


class ErrorDetail(BaseModel):
    """Specific field or parameter validation error."""
    field: Optional[str] = Field(None, description="Path to invalid property or field name")
    message: str = Field(..., description="Description of the validation or constraint failure")
    code: Optional[str] = Field(None, description="Specific error classification code")


class ErrorPayload(BaseModel):
    """Normalized SaaS platform error format."""
    code: str = Field(..., description="Machine-readable error code")
    message: str = Field(..., description="Human-readable error description")
    details: List[ErrorDetail] = Field(default_factory=list, description="List of granular error details")
    request_id: Optional[str] = Field(None, description="Unique correlation ID for tracing across services")


class StandardErrorResponse(BaseModel):
    """Unified error envelope returned by all API endpoints."""
    error: ErrorPayload


class PaginationParams(BaseModel):
    """Standardized pagination query parameters."""
    page: int = Field(1, ge=1, description="Page number starting from 1")
    page_size: int = Field(20, ge=1, le=100, description="Items per page (max 100)")
    sort_by: Optional[str] = Field("created_at", description="Field to sort by")
    sort_order: Optional[str] = Field("desc", pattern="^(asc|desc)$", description="Sort order: asc or desc")


class PaginatedResponse(BaseModel, Generic[T]):
    """Standard pagination envelope."""
    items: List[T]
    total: int = Field(..., description="Total items matching query")
    page: int = Field(..., description="Current page")
    page_size: int = Field(..., description="Page size")
    total_pages: int = Field(..., description="Total available pages")
    has_next: bool = Field(..., description="Whether subsequent page exists")
    has_prev: bool = Field(..., description="Whether previous page exists")


class StatusResponse(BaseModel):
    """Generic operation confirmation envelope."""
    status: str = Field("success", description="Status string: success or error")
    message: str = Field(..., description="User-facing response summary")
    data: Optional[Any] = Field(None, description="Optional payload returned by the operation")
