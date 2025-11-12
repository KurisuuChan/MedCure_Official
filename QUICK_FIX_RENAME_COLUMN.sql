-- ============================================================================
-- QUICK FIX: Rename margin_percentage to markup_percentage
-- Run this in Supabase SQL Editor NOW to fix the error
-- ============================================================================

-- Rename the column
ALTER TABLE products RENAME COLUMN margin_percentage TO markup_percentage;

-- Update comment
COMMENT ON COLUMN products.markup_percentage IS 
  'Markup %: (price_per_piece - cost_price) / cost_price * 100';

-- Verify (should return rows showing markup_percentage column)
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name IN ('markup_percentage', 'margin_percentage');

-- Show sample data to confirm values preserved
SELECT 
  id,
  generic_name,
  cost_price,
  price_per_piece,
  markup_percentage
FROM products 
WHERE markup_percentage IS NOT NULL
LIMIT 5;
