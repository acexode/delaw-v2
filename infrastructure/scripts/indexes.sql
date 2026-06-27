-- =============================================================================
-- DeLaw — Key Database Indexes (spec §3.4)
-- =============================================================================
-- Run this AFTER drizzle migrations have created the tables.
--
-- pgvector MUST be enabled on the database before the vector indexes below can
-- be created. This is intentionally NOT part of the generated migrations — the
-- extension has to exist first:
--
--     CREATE EXTENSION IF NOT EXISTS vector;
--
-- (Managed Postgres providers such as Neon/Supabase expose pgvector; enable it
-- once per database.)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS vector;

-- Tenant isolation (on every table)
CREATE INDEX IF NOT EXISTS idx_matters_org ON matters(organisation_id);
CREATE INDEX IF NOT EXISTS idx_documents_org ON documents(organisation_id);
CREATE INDEX IF NOT EXISTS idx_users_org ON users(organisation_id);

-- Semantic vector search
CREATE INDEX IF NOT EXISTS idx_legal_content_embedding ON legal_content
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_documents_embedding ON documents
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);

-- Full text search on legal content
CREATE INDEX IF NOT EXISTS idx_legal_content_fts ON legal_content
  USING gin(to_tsvector('english', title || ' ' || full_text));

-- Common query patterns
CREATE INDEX IF NOT EXISTS idx_matters_client ON matters(client_id);
CREATE INDEX IF NOT EXISTS idx_matters_status ON matters(organisation_id, status);
CREATE INDEX IF NOT EXISTS idx_documents_matter ON documents(matter_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_matter ON time_entries(matter_id);
CREATE INDEX IF NOT EXISTS idx_events_matter_date ON matter_events(matter_id, event_date);
CREATE INDEX IF NOT EXISTS idx_legal_content_jurisdiction ON legal_content(jurisdiction, type);
