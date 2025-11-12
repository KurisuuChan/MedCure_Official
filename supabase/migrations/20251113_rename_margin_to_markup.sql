-- ============================================================================
-- Migration: Rename margin_percentage to markup_percentage in products table
-- Date: 2025-11-13
-- Purpose: Standardize terminology - "markup" is the correct term for 
--          (selling_price - cost_price) / cost_price * 100
-- ============================================================================

-- Step 1: Rename the column in products table
ALTER TABLE products 
RENAME COLUMN margin_percentage TO markup_percentage;

-- Step 2: Update the column comment for clarity
COMMENT ON COLUMN products.markup_percentage IS 
  'Markup percentage: (price_per_piece - cost_price) / cost_price * 100. Note: This is different from profit margin. Markup shows profit as % of cost.';

-- Step 3: Verify the change
DO $$
BEGIN
  -- Check if the column exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'products' 
    AND column_name = 'markup_percentage'
  ) THEN
    RAISE NOTICE '✅ Column successfully renamed to markup_percentage';
  ELSE
    RAISE EXCEPTION '❌ Migration failed - markup_percentage column not found';
  END IF;
  
  -- Verify old column is gone
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'products' 
    AND column_name = 'margin_percentage'
  ) THEN
    RAISE EXCEPTION '❌ Old margin_percentage column still exists';
  ELSE
    RAISE NOTICE '✅ Old margin_percentage column removed';
  END IF;
END $$;

-- Step 4: Show sample of data to confirm values are preserved
SELECT 
  generic_name,
  cost_price,
  price_per_piece,
  markup_percentage,
  CASE 
    WHEN cost_price > 0 AND price_per_piece > 0 
    THEN ROUND(((price_per_piece - cost_price) / cost_price * 100)::numeric, 2)
    ELSE NULL
  END as calculated_markup
FROM products 
WHERE markup_percentage IS NOT NULL
LIMIT 5;
