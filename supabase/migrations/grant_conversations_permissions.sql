-- Grant permissions for conversations table
GRANT ALL PRIVILEGES ON conversations TO authenticated;
GRANT SELECT ON conversations TO anon;

-- Drop existing policy if it exists and create new one
DROP POLICY IF EXISTS "Users can manage their own conversations" ON conversations;
CREATE POLICY "Users can manage their own conversations" ON conversations
  FOR ALL USING (auth.uid() = user_id);

-- Enable RLS if not already enabled
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;