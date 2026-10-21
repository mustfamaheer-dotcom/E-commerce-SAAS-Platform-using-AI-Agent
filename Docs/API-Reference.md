# 📖 TechZone & Intelligent ERP Data Navigator: API Reference

**Lead Documenter:** Roaa Ashraf (Documentation Lead & Multi-Agent Interface Architect)  
**Version:** 1.0.0  
**Base URL:** `http://localhost:8001` (FastAPI ML & Agent) / `http://localhost:3000` (NestJS Gateway)

---

## 🧭 Authentication & Tenant Scoping
Every request MUST pass a verified tenant context header:
```http
x-tenant-id: tenant-demo-01
Authorization: Bearer <JWT_TOKEN>
```

---

## 1. Customer RFM Segmentation (`POST /ml/v1/customers/rfm-segmentation`)
Calculates Log-RFM customer features, fits K-Means ($K=5$), evaluates Silhouette score, and returns customer distributions and actionable retention advice.

### Request
```bash
curl -X POST "http://localhost:8001/ml/v1/customers/rfm-segmentation" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "tenant-demo-01"
  }'
```

### Response (`200 OK`)
```json
{
  "tenant_id": "tenant-demo-01",
  "silhouette_score": 0.5828,
  "davies_bouldin_score": 0.612,
  "total_customers": 50,
  "segments": [
    {
      "segment_name": "VIP Champions",
      "customer_count": 10,
      "avg_recency_days": 7.2,
      "avg_frequency": 11.4,
      "avg_monetary_egp": 48500.0,
      "recommended_action_ar": "قدم لهم وصول مبكر للمنتجات الجديدة ومكافآت ولاء مميزة.",
      "recommended_action_en": "Offer early access to new collections and loyalty rewards.",
      "badge_color": "emerald"
    },
    {
      "segment_name": "At-Risk of Churn",
      "customer_count": 10,
      "avg_recency_days": 88.4,
      "avg_frequency": 7.8,
      "avg_monetary_egp": 29400.0,
      "recommended_action_ar": "اطلق حملة استعادة فورية بكوبون خصم 15% للعملاء المعرضين للمغادرة.",
      "recommended_action_en": "Launch targeted win-back campaign with a 15% discount.",
      "badge_color": "rose"
    }
  ],
  "card_type": "customer_segments"
}
```

---

## 2. Sales Forecasting & SHAP Explainability (`POST /ml/v1/forecast/predict`)
Returns point forecast, 95% conformal prediction intervals, SHAP demand drivers, and restock recommendation.

### Request
```bash
curl -X POST "http://localhost:8001/ml/v1/forecast/predict" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "tenant-demo-01",
    "product_id": "prod_101",
    "horizon_days": 30
  }'
```

### Response (`200 OK`)
```json
{
  "card_type": "sales_forecast",
  "product": {
    "id": "prod_101",
    "name": "JBL Flip 6 Waterproof Speaker",
    "sku": "SKU-PROD-101",
    "current_stock": 80
  },
  "horizon_days": 30,
  "totals": {
    "yhat": 141.8,
    "yhat_lower": 134.4,
    "yhat_upper": 149.2
  },
  "restock": {
    "current_stock": 80,
    "suggested_order_qty": 85,
    "stockout_risk_p95": 0.94
  }
}
```

---

## 3. Storefront Checkout & Payments (`POST /api/v1/orders/checkout`)
Handles inventory validation, coupon discount application, Paymob intention creation, and Bosta waybill generation.

### Request
```bash
curl -X POST "http://localhost:3000/api/v1/orders/checkout" \
  -H "x-tenant-id: tenant-demo-01" \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Ahmed Mostafa",
    "customerEmail": "ahmed.mostafa@example.eg",
    "city": "Cairo",
    "streetAddress": "15 Tahrir Square",
    "paymentMethod": "CARD",
    "promoCode": "WINBACK15",
    "items": [
      { "productId": "prod_101", "quantity": 1 }
    ]
  }'
```

### Response (`200 OK`)
```json
{
  "orderId": "ord_918204",
  "status": "PENDING",
  "subtotal": 5000.0,
  "discountApplied": 750.0,
  "finalTotal": 4250.0,
  "currency": "EGP",
  "payment": {
    "intentionId": "int_99a8b1",
    "clientSecret": "cs_204192",
    "redirectUrl": "https://accept.paymob.com/unifiedcheckout/?...",
    "status": "INTENTION_CREATED"
  }
}
```

---

## 4. Immutable Agent Audit Logging (`POST /api/v1/audit/log-action`)
Append-only log of sensitive state-mutating actions.

### Request
```bash
curl -X POST "http://localhost:3000/api/v1/audit/log-action" \
  -H "x-tenant-id: tenant-demo-01" \
  -H "Content-Type: application/json" \
  -d '{
    "toolName": "create_promotion_for_segment",
    "params": { "segment": "At-Risk of Churn", "discount_pct": 15 },
    "status": "PENDING_CONFIRMATION"
  }'
```

---

## 5. Paymob Webhook Callback (`POST /api/v1/webhooks/paymob`)
Authenticates HMAC-SHA512 header, transitions order status to `PAID`, and triggers Bosta AWB waybill dispatch.
