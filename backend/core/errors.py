# backend/core/errors.py
"""Domain-specific exceptions with error codes and HTTP status mappings."""
from typing import Any, List, Optional


class PlatformException(Exception):
    """Base domain exception for all SaaS platform errors."""
    def __init__(
        self,
        message: str,
        code: str = "INTERNAL_SERVER_ERROR",
        status_code: int = 500,
        details: Optional[List[Any]] = None,
    ):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or []


class EntityNotFoundException(PlatformException):
    def __init__(self, entity_name: str, identifier: str):
        super().__init__(
            message=f"{entity_name} with identifier '{identifier}' was not found.",
            code="ENTITY_NOT_FOUND",
            status_code=404,
        )


class TenantAccessDeniedException(PlatformException):
    def __init__(self, message: str = "Access denied: insufficient tenant authorization or cross-tenant access violation."):
        super().__init__(
            message=message,
            code="TENANT_ACCESS_DENIED",
            status_code=403,
        )


class InvalidOrderStateTransitionException(PlatformException):
    def __init__(self, current_status: str, target_status: str):
        super().__init__(
            message=f"Invalid order lifecycle transition from '{current_status}' to '{target_status}'.",
            code="INVALID_ORDER_STATE_TRANSITION",
            status_code=409,
        )


class InsufficientStockException(PlatformException):
    def __init__(self, product_name: str, requested: int, available: int):
        super().__init__(
            message=f"Insufficient inventory for '{product_name}'. Requested: {requested}, Available: {available}.",
            code="INSUFFICIENT_STOCK",
            status_code=409,
        )


class ValidationException(PlatformException):
    def __init__(self, message: str, details: Optional[List[Any]] = None):
        super().__init__(
            message=message,
            code="VALIDATION_FAILED",
            status_code=422,
            details=details,
        )


class SecurityGuardrailException(PlatformException):
    def __init__(self, message: str = "Security constraint violated: Prompt injection or restricted system directive blocked."):
        super().__init__(
            message=message,
            code="SECURITY_GUARDRAIL_BLOCKED",
            status_code=400,
        )
