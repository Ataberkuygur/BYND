-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  amount VARCHAR(50) NOT NULL,
  due_date DATE NOT NULL,
  description TEXT,
  category VARCHAR(100) DEFAULT 'general',
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);

-- Create index on due_date for sorting
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON payments(due_date);

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments" ON payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payments" ON payments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payments" ON payments
  FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions to roles
GRANT ALL PRIVILEGES ON payments TO authenticated;
GRANT SELECT ON payments TO anon;

-- Insert some sample data for testing
INSERT INTO payments (user_id, title, amount, due_date, description, category) VALUES
  ('12345678-1234-1234-1234-123456789abc'::UUID, 'Netflix Subscription', '$15.99', '2025-02-15', 'Monthly Netflix subscription payment', 'entertainment'),
  ('12345678-1234-1234-1234-123456789abc'::UUID, 'Electric Bill', '$89.50', '2025-02-20', 'Monthly electricity bill', 'utilities'),
  ('12345678-1234-1234-1234-123456789abc'::UUID, 'Internet Bill', '$59.99', '2025-02-25', 'Monthly internet service', 'utilities')
ON CONFLICT (id) DO NOTHING;

-- Verify table creation
SELECT 'Payments table created successfully' AS status;
SELECT COUNT(*) AS payment_count FROM payments;