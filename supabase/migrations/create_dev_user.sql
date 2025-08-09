-- Create development user for testing purposes
-- This user is only for development mode when authentication is bypassed

INSERT INTO users (id, email, password_hash, created_at)
VALUES (
  '12345678-1234-1234-1234-123456789abc',
  'dev@example.com',
  '$2a$10$dummy.hash.for.development.user.only',
  NOW()
)
ON CONFLICT (id) DO NOTHING;