-- Migration 008: Add pgvector + RAG embeddings
-- Purpose: Enable semantic search for MCP servers

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS server_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID REFERENCES mcp_servers(id) ON DELETE CASCADE,
  source_type VARCHAR(50) NOT NULL, -- 'readme', 'docs', 'metadata', etc.
  content TEXT NOT NULL,
  embedding vector(1536) NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_server_embeddings_server_id ON server_embeddings(server_id);
CREATE INDEX IF NOT EXISTS idx_server_embeddings_source ON server_embeddings(source_type);
CREATE INDEX IF NOT EXISTS idx_server_embeddings_embedding ON server_embeddings
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE TRIGGER update_server_embeddings_updated_at
  BEFORE UPDATE ON server_embeddings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
