-- docker/init-db/001-extensions.sql
-- Enable pgvector extension (if available)
DO $$
BEGIN
    BEGIN
        CREATE EXTENSION IF NOT EXISTS vector;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'pgvector extension not available, skipping...';
    END;
END $$;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 更新更新时间函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS 'Trigger function to update updated_at timestamp';
