-- Seed script for admin user
-- Usage: docker-compose exec postgres psql -U postgres -d pbl_platform -f seed-admin-user.sql

-- Insert admin user (password: admin123)
-- Note: In production, use proper password hashing
INSERT INTO users (id, username, password_hash, nickname, role, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin',
  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- admin123 hashed with bcrypt
  '管理员',
  'admin',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  password_hash = EXCLUDED.password_hash,
  nickname = EXCLUDED.nickname,
  role = EXCLUDED.role;

-- Verify user was created
SELECT id, username, nickname, role FROM users WHERE username = 'admin';
