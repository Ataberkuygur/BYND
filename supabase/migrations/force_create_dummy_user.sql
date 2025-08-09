-- Delete any existing dummy user first
DELETE FROM users WHERE id = '12345678-1234-1234-1234-123456789abc';

-- Insert dummy user with explicit UUID casting
INSERT INTO users (id, email, password_hash, created_at) 
VALUES (
  '12345678-1234-1234-1234-123456789abc'::uuid,
  'dummy@example.com',
  'dummy_hash',
  NOW()
);

-- Verify the user was created
SELECT id, email, created_at FROM users WHERE id = '12345678-1234-1234-1234-123456789abc'::uuid;

-- Also grant permissions to ensure access
GRANT ALL PRIVILEGES ON users TO authenticated;
GRANT SELECT ON users TO anon;