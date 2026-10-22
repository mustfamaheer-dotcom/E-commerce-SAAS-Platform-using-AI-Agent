-- backend/db/schema.sql
-- Complete Multi-Tenant PostgreSQL Schema for TechZone ERP & E-Commerce

-- Extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Core Multi-Tenant Stores
CREATE TABLE IF NOT EXISTS tenants (
    id VARCHAR(64) PRIMARY KEY,
    slug VARCHAR(128) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    logo_url TEXT,
    currency VARCHAR(10) DEFAULT 'EGP',
    theme_config JSONB DEFAULT '{"mode": "dark", "primaryColor": "#0ea5e9", "secondaryColor": "#6366f1", "accentColor": "#10b981"}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Users / Merchants / Staff / Customers
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(32) DEFAULT 'owner', -- owner, staff, customer
    password_hash VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Store Configurations & Integrations
CREATE TABLE IF NOT EXISTS store_settings (
    tenant_id VARCHAR(64) PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
    display_name VARCHAR(255) NOT NULL,
    currency VARCHAR(10) DEFAULT 'EGP',
    business_sector VARCHAR(100) DEFAULT 'electronics',
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    shipping_zones JSONB DEFAULT '{"default_rate": 45, "cairo_giza": 45, "governorates": 65, "carrier": "Bosta"}'::jsonb,
    payment_gateways JSONB DEFAULT '{"paymob_active": true, "instapay_active": true, "fawry_active": true, "cod_active": true}'::jsonb,
    bosta_api_key VARCHAR(255),
    paymob_api_key VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Dynamic Themes
CREATE TABLE IF NOT EXISTS theme_config (
    tenant_id VARCHAR(64) PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
    mode VARCHAR(10) DEFAULT 'dark', -- dark or light
    primary_color VARCHAR(32) DEFAULT '#0ea5e9',
    secondary_color VARCHAR(32) DEFAULT '#6366f1',
    accent_color VARCHAR(32) DEFAULT '#10b981',
    background_dark VARCHAR(32) DEFAULT '#020617',
    background_light VARCHAR(32) DEFAULT '#f8fafc',
    logo_url TEXT,
    font_family VARCHAR(100) DEFAULT 'Cairo, sans-serif',
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Catalog: Categories
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) REFERENCES tenants(id) ON DELETE CASCADE,
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    slug VARCHAR(255) NOT NULL,
    parent_id VARCHAR(64) REFERENCES categories(id) ON DELETE SET NULL,
    image_url TEXT,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, slug)
);

-- Catalog: Products
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) REFERENCES tenants(id) ON DELETE CASCADE,
    category_id VARCHAR(64) REFERENCES categories(id) ON DELETE SET NULL,
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    slug VARCHAR(255) NOT NULL,
    description_ar TEXT,
    description_en TEXT,
    price NUMERIC(12, 2) NOT NULL,
    cost_price NUMERIC(12, 2) DEFAULT 0,
    compare_price NUMERIC(12, 2),
    sku VARCHAR(100) NOT NULL,
    stock_qty INT DEFAULT 0,
    low_stock_threshold INT DEFAULT 5,
    images JSONB DEFAULT '[]'::jsonb,
    attributes JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, sku)
);

-- Product Variants
CREATE TABLE IF NOT EXISTS product_variants (
    id VARCHAR(64) PRIMARY KEY,
    product_id VARCHAR(64) REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NOT NULL,
    price_modifier NUMERIC(12, 2) DEFAULT 0,
    stock_qty INT DEFAULT 0,
    attributes JSONB DEFAULT '{}'::jsonb
);

-- Commerce: Orders
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) REFERENCES tenants(id) ON DELETE CASCADE,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(32) DEFAULT 'PENDING', -- PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED
    items JSONB NOT NULL, -- [{product_id, name, price, qty, total}]
    subtotal NUMERIC(12, 2) NOT NULL,
    shipping_cost NUMERIC(12, 2) DEFAULT 0,
    discount NUMERIC(12, 2) DEFAULT 0,
    total NUMERIC(12, 2) NOT NULL,
    payment_method VARCHAR(32) DEFAULT 'CARD', -- CARD, INSTAPAY, FAWRY, COD
    payment_status VARCHAR(32) DEFAULT 'UNPAID', -- UNPAID, PAID, REFUNDED
    payment_ref VARCHAR(128),
    bosta_tracking_number VARCHAR(128),
    shipping_address JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Order Status Log
CREATE TABLE IF NOT EXISTS order_status_log (
    id VARCHAR(64) PRIMARY KEY,
    order_id VARCHAR(64) REFERENCES orders(id) ON DELETE CASCADE,
    status VARCHAR(32) NOT NULL,
    note TEXT,
    created_by VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Marketing: Coupons
CREATE TABLE IF NOT EXISTS coupons (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(64) NOT NULL,
    type VARCHAR(16) DEFAULT 'percent', -- percent or fixed
    value NUMERIC(12, 2) NOT NULL,
    min_order NUMERIC(12, 2) DEFAULT 0,
    max_uses INT DEFAULT 100,
    used_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, code)
);

-- Customer CRM
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    governorate VARCHAR(100),
    city VARCHAR(100),
    address TEXT,
    total_orders INT DEFAULT 0,
    total_spent NUMERIC(14, 2) DEFAULT 0,
    last_order_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI Agent Sessions & Message History
CREATE TABLE IF NOT EXISTS agent_sessions (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) REFERENCES tenants(id) ON DELETE CASCADE,
    user_id VARCHAR(64),
    title VARCHAR(255) DEFAULT 'محادثة جديدة',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS agent_messages (
    id VARCHAR(64) PRIMARY KEY,
    session_id VARCHAR(64) REFERENCES agent_sessions(id) ON DELETE CASCADE,
    role VARCHAR(32) NOT NULL, -- user, assistant, system, tool
    content TEXT NOT NULL,
    card_type VARCHAR(64),
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS agent_actions (
    id VARCHAR(64) PRIMARY KEY,
    session_id VARCHAR(64) REFERENCES agent_sessions(id) ON DELETE CASCADE,
    action_type VARCHAR(64) NOT NULL,
    payload JSONB,
    result JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Materialized / Aggregated Daily Analytics
CREATE TABLE IF NOT EXISTS analytics_daily (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) REFERENCES tenants(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    orders_count INT DEFAULT 0,
    revenue NUMERIC(14, 2) DEFAULT 0,
    new_customers INT DEFAULT 0,
    top_products JSONB DEFAULT '[]'::jsonb,
    UNIQUE(tenant_id, date)
);
