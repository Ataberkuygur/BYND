-- Check if dummy user exists
SELECT id, email, created_at FROM users WHERE id = '12345678-1234-1234-1234-123456789abc';

-- If not exists, insert it
INSERT INTO users (id, email, password_hash, created_at) 
SELECT 
  '12345678-1234-1234-1234-123456789abc',
  'dummy@example.com',
  'dummy_hash',
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE id = '12345678-1234-1234-1234-123456789abc'
);

-- Verify again
SELECT id, email, created_at FROM users WHERE id = '12345678-1234-1234-1234-123456789abc';