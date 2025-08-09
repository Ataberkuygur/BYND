-- Create dummy user for development mode
INSERT INTO users (id, email, password_hash, created_at) 
VALUES (
  '12345678-1234-1234-1234-123456789abc',
  'dummy@example.com',
  'dummy_hash',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Verify the user was created
SELECT id, email FROM users WHERE id = '12345678-1234-1234-1234-123456789abc';