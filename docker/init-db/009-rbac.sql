-- docker/init-db/009-rbac.sql
-- Add RBAC (Role-Based Access Control) tables for permission management

-- Create admin_roles table (predefined roles)
CREATE TABLE IF NOT EXISTS admin_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create role_permissions association table
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES admin_roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, permission_id)
);

-- Create user_roles association table
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES admin_roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, role_id)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource);
CREATE INDEX IF NOT EXISTS idx_permissions_action ON permissions(action);

-- Insert default roles
INSERT INTO admin_roles (name, description) VALUES
    ('ADMIN', 'Administrator with full access'),
    ('USER', 'Regular user with limited access')
ON CONFLICT (name) DO NOTHING;

-- Insert default permissions
INSERT INTO permissions (name, description, resource, action) VALUES
    ('users:read', 'View users', 'users', 'read'),
    ('users:write', 'Create and update users', 'users', 'write'),
    ('users:delete', 'Delete users', 'users', 'delete'),
    ('agents:read', 'View agents', 'agents', 'read'),
    ('agents:write', 'Create and update agents', 'agents', 'write'),
    ('agents:delete', 'Delete agents', 'agents', 'delete'),
    ('projects:read', 'View projects', 'projects', 'read'),
    ('projects:write', 'Create and update projects', 'projects', 'write'),
    ('projects:delete', 'Delete projects', 'projects', 'delete'),
    ('works:read', 'View works', 'works', 'read'),
    ('works:write', 'Create and update works', 'works', 'write'),
    ('works:delete', 'Delete works', 'works', 'delete'),
    ('works:review', 'Review and approve works', 'works', 'review')
ON CONFLICT (name) DO NOTHING;

-- Assign all permissions to ADMIN role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM admin_roles r, permissions p
WHERE r.name = 'ADMIN'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Add comment for documentation
COMMENT ON TABLE admin_roles IS 'Predefined roles for RBAC system';
COMMENT ON TABLE permissions IS 'Permission definitions for RBAC system';
COMMENT ON TABLE role_permissions IS 'Association between roles and permissions';
COMMENT ON TABLE user_roles IS 'Association between users and roles';
