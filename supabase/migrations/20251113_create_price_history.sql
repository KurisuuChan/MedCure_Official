-- Create price_history table to track all price changes
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  old_price DECIMAL(10, 2),
  new_price DECIMAL(10, 2) NOT NULL,
  old_cost_price DECIMAL(10, 2),
  new_cost_price DECIMAL(10, 2),
  old_markup_percentage DECIMAL(5, 2),
  new_markup_percentage DECIMAL(5, 2),
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_price_history_product_id ON price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_created_at ON price_history(created_at DESC);

-- Add RLS policies
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view price history
CREATE POLICY "Users can view price history"
  ON price_history
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert price history
CREATE POLICY "Users can insert price history"
  ON price_history
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE price_history IS 'Tracks all price changes for products including unit price, cost price, and markup percentage changes';
COMMENT ON COLUMN price_history.product_id IS 'Reference to the product whose price changed';
COMMENT ON COLUMN price_history.old_price IS 'Previous unit price (selling price)';
COMMENT ON COLUMN price_history.new_price IS 'New unit price (selling price)';
COMMENT ON COLUMN price_history.old_cost_price IS 'Previous cost price';
COMMENT ON COLUMN price_history.new_cost_price IS 'New cost price';
COMMENT ON COLUMN price_history.old_markup_percentage IS 'Previous markup percentage';
COMMENT ON COLUMN price_history.new_markup_percentage IS 'New markup percentage';
COMMENT ON COLUMN price_history.changed_by IS 'User who made the price change';
COMMENT ON COLUMN price_history.reason IS 'Optional reason for the price change';
COMMENT ON COLUMN price_history.created_at IS 'When the price change occurred';
