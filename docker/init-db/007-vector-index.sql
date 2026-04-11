-- docker/init-db/007-vector-index.sql
-- Add pgvector support for agent_memories table

-- Enable pgvector extension (if not already enabled)
DO $$
BEGIN
    BEGIN
        CREATE EXTENSION IF NOT EXISTS vector;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'pgvector extension not available, skipping...';
    END;
END $$;

-- Add embedding column to agent_memories if it doesn't exist
-- Using vector(384) for sentence-transformers all-MiniLM-L6-v2 model
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'agent_memories'
        AND column_name = 'embedding'
    ) THEN
        ALTER TABLE agent_memories
        ADD COLUMN embedding vector(384);

        RAISE NOTICE 'Added embedding column to agent_memories table';
    END IF;
END $$;

-- Add metadata and consolidation columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'agent_memories'
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE agent_memories
        ADD COLUMN metadata JSONB;

        RAISE NOTICE 'Added metadata column to agent_memories table';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'agent_memories'
        AND column_name = 'expires_at'
    ) THEN
        ALTER TABLE agent_memories
        ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;

        RAISE NOTICE 'Added expires_at column to agent_memories table';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'agent_memories'
        AND column_name = 'consolidated'
    ) THEN
        ALTER TABLE agent_memories
        ADD COLUMN consolidated BOOLEAN DEFAULT FALSE;

        RAISE NOTICE 'Added consolidated column to agent_memories table';
    END IF;
END $$;

-- Create index for vector similarity search using cosine distance
-- This index speeds up similarity searches significantly
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'agent_memories'
        AND indexname = 'idx_agent_memories_embedding'
    ) THEN
        CREATE INDEX idx_agent_memories_embedding
        ON agent_memories
        USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100);

        RAISE NOTICE 'Created vector similarity index on agent_memories.embedding';
    END IF;
END $$;

-- Create composite index for filtered vector searches
-- Optimizes queries that filter by agent_id and type before similarity search
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'agent_memories'
        AND indexname = 'idx_agent_memories_agent_type'
    ) THEN
        CREATE INDEX idx_agent_memories_agent_type
        ON agent_memories (agent_id, type);

        RAISE NOTICE 'Created composite index on agent_memories(agent_id, type)';
    END IF;
END $$;

-- Grant necessary permissions (adjust role name as needed)
DO $$
BEGIN
    -- Grant usage on vector type to public
    GRANT USAGE ON TYPE vector TO PUBLIC;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Permission grant failed, may already have permissions';
END $$;

COMMENT ON COLUMN agent_memories.embedding IS 'Sentence embedding vector for semantic search (384 dimensions)';
