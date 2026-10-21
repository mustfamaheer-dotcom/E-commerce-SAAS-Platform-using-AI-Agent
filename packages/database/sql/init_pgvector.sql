-- packages/database/sql/init_pgvector.sql
-- Roaa Ashraf (Vertical Slice 06): Store Policy RAG with pgvector HNSW & Audit Logging

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Store Policy Vector Store Table
CREATE TABLE IF NOT EXISTS store_policy_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    doc_title TEXT NOT NULL,
    chunk_index INT NOT NULL DEFAULT 0,
    content TEXT NOT NULL,
    embedding vector(1536) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. HNSW Index for ultra-fast cosine similarity vector search
CREATE INDEX IF NOT EXISTS idx_policy_chunks_embedding_hnsw
    ON store_policy_chunks USING hnsw (embedding vector_cosine_ops);

-- 4. Row-Level Security for Policy Chunks & Audit Log
ALTER TABLE IF EXISTS store_policy_chunks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_policy_chunks ON store_policy_chunks;
CREATE POLICY tenant_isolation_policy_chunks ON store_policy_chunks
    FOR ALL
    USING (tenant_id::text = current_setting('app.current_tenant_id', true))
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

ALTER TABLE IF EXISTS agent_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_agent_actions ON agent_actions;
CREATE POLICY tenant_isolation_agent_actions ON agent_actions
    FOR ALL
    USING (tenant_id::text = current_setting('app.current_tenant_id', true))
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

ALTER TABLE IF EXISTS merchant_memories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_merchant_memories ON merchant_memories;
CREATE POLICY tenant_isolation_merchant_memories ON merchant_memories
    FOR ALL
    USING (tenant_id::text = current_setting('app.current_tenant_id', true))
    WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));
