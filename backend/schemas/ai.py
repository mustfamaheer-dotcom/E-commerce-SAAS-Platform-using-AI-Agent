# backend/schemas/ai.py
"""Comprehensive AI Orchestration, Tool Invocation, GenUI Payload, and Structured Response Contracts."""
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, ConfigDict, model_validator


class AIActionItemDTO(BaseModel):
    """Interactive action button to render in chat UI."""
    label: str = Field(..., description="Action button title, e.g., 'إضافة للسلة' or 'تتبع الشحنة'")
    action: str = Field(..., description="Action identifier: add_to_cart | view_product | track_order | apply_coupon | escalate_support")
    params: Dict[str, Any] = Field(default_factory=dict, description="Payload required by the frontend action dispatcher")


class AIProductSummaryDTO(BaseModel):
    """Structured product citation for UI product cards."""
    id: str
    name_ar: str
    name_en: Optional[str] = None
    price: float
    compare_price: Optional[float] = None
    sku: str
    stock_qty: int
    is_in_stock: bool
    image_url: Optional[str] = None
    category_id: Optional[str] = None


class AIOrderSummaryDTO(BaseModel):
    """Structured order tracking citation for order cards."""
    order_id: str
    status: str
    total: float
    currency: str = "EGP"
    items_count: int
    payment_method: str
    payment_status: str
    tracking_number: Optional[str] = None
    estimated_delivery: Optional[str] = None
    created_at: Optional[str] = None


class AIQueryRequestDTO(BaseModel):
    """Incoming user chat query."""
    message: str = Field(..., min_length=1, description="User natural language message in Arabic or English")
    session_id: Optional[str] = Field("sess_default", description="Conversation session ID")
    tenant_id: Optional[str] = Field(None, description="Store / tenant identifier")
    role: str = Field("customer", pattern="^(customer|merchant|admin)$", description="Conversation role: customer (storefront) or merchant (admin)")
    customer_phone: Optional[str] = Field(None, description="Optional customer phone for authenticated order lookup")
    customer_email: Optional[str] = Field(None, description="Optional customer email")
    cart_items_count: Optional[int] = Field(0, description="Optional current shopping cart item count for context")
    history: Optional[List[Dict[str, Any]]] = Field(default_factory=list, description="Recent conversation turns for full context awareness")


class AIToolCallDTO(BaseModel):
    """Detailed tool execution trace."""
    tool_name: str
    arguments: Dict[str, Any]
    status: str = Field("PENDING", pattern="^(PENDING|EXECUTED|REJECTED|FAILED)$")
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    latency_ms: Optional[float] = None


class AIResponseDTO(BaseModel):
    """Production structured AI response contract for conversational commerce."""
    model_config = ConfigDict(populate_by_name=True)

    reply_text: str = Field(..., description="Assistant natural language reply in Arabic or English")
    response: Optional[str] = Field(None, description="Backward-compatible alias for reply_text")
    language: str = Field("ar", pattern="^(ar|en)$", description="Detected or preferred language: ar or en")
    intent: str = Field("general_dialogue", description="Classified intent route")
    intent_route: Optional[str] = Field(None, description="Backward-compatible alias for intent")
    confidence: float = Field(1.0, ge=0.0, le=1.0, description="Confidence score from 0.0 to 1.0")
    session_id: str = Field(..., description="Conversation session ID")
    tenant_id: str = Field(..., description="Scoped tenant store ID")

    # GenUI Rendering properties
    card_type: Optional[str] = Field(None, description="Frontend GenUI card type identifier")
    gen_ui_payload: Optional[Dict[str, Any]] = Field(None, description="GenUI card component props")

    # Domain specific grounding & citations
    citations: List[str] = Field(default_factory=list, description="Grounding data sources, policies, or SKUs used")
    products: List[AIProductSummaryDTO] = Field(default_factory=list, description="Products referenced in the response")
    order_summary: Optional[AIOrderSummaryDTO] = Field(None, description="Order details if query was about order tracking")

    # Conversational commerce guidance
    actions: List[AIActionItemDTO] = Field(default_factory=list, description="Interactive action pills/buttons for the customer/merchant")
    follow_up_suggestions: List[str] = Field(default_factory=list, description="Suggested quick-reply chips in Arabic/English")
    requires_human_support: bool = Field(False, description="Flag indicating unresolved complaint or low-confidence handoff")
    warnings: List[str] = Field(default_factory=list, description="Any safety warnings, stock limitations, or margin alerts")

    # Observability & Trace metadata
    tool_calls: List[AIToolCallDTO] = Field(default_factory=list, description="List of internal tools executed")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Latency, token estimates, and correlation IDs")

    @model_validator(mode="after")
    def sync_legacy_aliases(self) -> "AIResponseDTO":
        if not self.response:
            self.response = self.reply_text
        if not self.intent_route:
            self.intent_route = self.intent
        return self


class AIUsageLogDTO(BaseModel):
    """Audit and billing token usage log."""
    tenant_id: str
    session_id: str
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    latency_ms: float = 0.0
    tool_name: Optional[str] = None
    created_at: Optional[datetime] = None
