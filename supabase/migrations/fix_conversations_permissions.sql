-- Grant permissions for conversations table
GRANT ALL PRIVILEGES ON conversations TO authenticated;
GRANT SELECT ON conversations TO anon;

-- Check current permissions
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'conversations' 
AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;