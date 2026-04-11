-- docker/init-db/008-audit-logs.sql
-- Add audit_logs table for tracking administrative actions

-- Create audit_logs table if not exists
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    user_id UUID,
    username VARCHAR(50),
    metadata JSONB,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Add comment for documentation
COMMENT ON TABLE audit_logs IS 'Audit trail for tracking administrative actions and system events';
COMMENT ON COLUMN audit_logs.action IS 'Type of action performed (e.g., CREATE_USER, UPDATE_AGENT, DELETE_WORK)';
COMMENT ON COLUMN audit_logs.entity_type IS 'Type of entity affected (e.g., User, Agent, Project, Work)';
COMMENT ON COLUMN audit_logs.entity_id IS 'UUID of the affected entity';
COMMENT ON COLUMN audit_logs.user_id IS 'UUID of the user who performed the action';
COMMENT ON COLUMN audit_logs.username IS 'Username of the user who performed the action';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional context data about the action (JSON)';
COMMENT ON COLUMN audit_logs.ip_address IS 'IP address of the request origin';
COMMENT ON COLUMN audit_logs.user_agent IS 'User agent string from the request';
