-- ============================================================================
-- FIFO BATCH-BASED PRICING SYSTEM
-- Migration: Add batch-specific pricing and FIFO sales tracking
-- Created: 2025-01-01
-- ============================================================================

-- ============================================================================
-- STEP 1: Add Pricing Columns to product_batches
-- ============================================================================

-- Add purchase and selling prices to each batch
ALTER TABLE product_batches 
ADD COLUMN IF NOT EXISTS purchase_price NUMERIC CHECK (purchase_price >= 0),
ADD COLUMN IF NOT EXISTS selling_price NUMERIC CHECK (selling_price > 0),
ADD COLUMN IF NOT EXISTS markup_percentage NUMERIC DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN product_batches.purchase_price IS 'Cost per unit paid to supplier';
COMMENT ON COLUMN product_batches.selling_price IS 'Price per unit charged to customer';
COMMENT ON COLUMN product_batches.markup_percentage IS 'Auto-calculated: (selling - purchase) / purchase * 100';

-- ============================================================================
-- STEP 2: Add COGS and Profit Tracking to sales
-- ============================================================================

ALTER TABLE sales
ADD COLUMN IF NOT EXISTS total_cogs NUMERIC DEFAULT 0 CHECK (total_cogs >= 0),
ADD COLUMN IF NOT EXISTS gross_profit NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS profit_margin_percentage NUMERIC DEFAULT 0;

COMMENT ON COLUMN sales.total_cogs IS 'Total Cost of Goods Sold (sum of batch purchase prices)';
COMMENT ON COLUMN sales.gross_profit IS 'Revenue - COGS';
COMMENT ON COLUMN sales.profit_margin_percentage IS '(Profit / Revenue) * 100';

-- ============================================================================
-- STEP 3: Create sale_batch_allocations Tracking Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS sale_batch_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  sale_item_id UUID NOT NULL REFERENCES sale_items(id) ON DELETE CASCADE,
  batch_id BIGINT NOT NULL REFERENCES product_batches(id),
  product_id UUID NOT NULL REFERENCES products(id),
  quantity_sold INTEGER NOT NULL CHECK (quantity_sold > 0),
  batch_purchase_price NUMERIC NOT NULL,
  batch_selling_price NUMERIC NOT NULL,
  item_cogs NUMERIC NOT NULL, -- quantity * purchase_price
  item_revenue NUMERIC NOT NULL, -- quantity * selling_price
  item_profit NUMERIC NOT NULL, -- revenue - cogs
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_sale_batch_allocations_sale_id ON sale_batch_allocations(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_batch_allocations_batch_id ON sale_batch_allocations(batch_id);
CREATE INDEX IF NOT EXISTS idx_sale_batch_allocations_product_id ON sale_batch_allocations(product_id);

COMMENT ON TABLE sale_batch_allocations IS 'Tracks which batches were used for each sale (FIFO)';

-- ============================================================================
-- STEP 4: Function to Get Current Batch Price (FIFO - Oldest First)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_current_batch_price(p_product_id UUID)
RETURNS TABLE(
  batch_id BIGINT,
  selling_price NUMERIC,
  purchase_price NUMERIC,
  available_quantity INTEGER,
  expiry_date DATE,
  batch_number TEXT
) AS $$
BEGIN
  -- Get the oldest active batch with stock available (FIFO)
  RETURN QUERY
  SELECT 
    pb.id,
    COALESCE(pb.selling_price, p.price_per_piece) as selling_price,
    COALESCE(pb.purchase_price, pb.cost_per_unit, 0) as purchase_price,
    pb.quantity as available_quantity,
    pb.expiry_date,
    pb.batch_number
  FROM product_batches pb
  JOIN products p ON p.id = pb.product_id
  WHERE 
    pb.product_id = p_product_id
    AND pb.quantity > 0
    AND pb.status = 'active'
    AND (pb.expiry_date IS NULL OR pb.expiry_date > CURRENT_DATE)
  ORDER BY pb.created_at ASC, pb.expiry_date ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_current_batch_price IS 'Returns pricing from oldest available batch (FIFO)';

-- ============================================================================
-- STEP 4B: Function to Update Product Price from Oldest Batch (FIFO)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_product_price_from_fifo(p_product_id UUID)
RETURNS VOID AS $$
DECLARE
  v_oldest_batch RECORD;
BEGIN
  -- Get the oldest active batch with stock
  SELECT 
    selling_price,
    purchase_price
  INTO v_oldest_batch
  FROM product_batches
  WHERE 
    product_id = p_product_id
    AND quantity > 0
    AND status = 'active'
    AND (expiry_date IS NULL OR expiry_date > CURRENT_DATE)
  ORDER BY created_at ASC, expiry_date ASC
  LIMIT 1;
  
  -- Update product price to match oldest batch (FIFO principle)
  IF v_oldest_batch.selling_price IS NOT NULL THEN
    UPDATE products
    SET 
      price_per_piece = v_oldest_batch.selling_price,
      updated_at = NOW()
    WHERE id = p_product_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_product_price_from_fifo IS 'Updates product selling price to match oldest available batch (FIFO)';

-- ============================================================================
-- STEP 5: Enhanced add_product_batch to Handle Pricing
-- ============================================================================

-- First, drop ALL existing versions to avoid conflicts
DROP FUNCTION IF EXISTS add_product_batch(UUID, INTEGER, DATE);
DROP FUNCTION IF EXISTS add_product_batch(UUID, INTEGER, DATE, NUMERIC, TEXT, TEXT);
DROP FUNCTION IF EXISTS add_product_batch;

-- Create new version with pricing parameters
CREATE OR REPLACE FUNCTION add_product_batch(
  p_product_id UUID,
  p_quantity INTEGER,
  p_expiry_date DATE DEFAULT NULL,
  p_purchase_price NUMERIC DEFAULT NULL,
  p_selling_price NUMERIC DEFAULT NULL,
  p_supplier_name TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_batch_id BIGINT;
  v_batch_number TEXT;
  v_current_stock INTEGER;
  v_new_stock INTEGER;
  v_markup_percentage NUMERIC;
BEGIN
  -- Generate batch number in format: BT + MMDDYY + sequential number
  DECLARE
    v_date_part TEXT;
    v_count INTEGER;
  BEGIN
    v_date_part := TO_CHAR(NOW(), 'MMDDYY');
    
    -- Get count of batches created today for this product
    SELECT COUNT(*) INTO v_count
    FROM product_batches
    WHERE product_id = p_product_id
      AND DATE(created_at) = CURRENT_DATE;
    
    v_batch_number := 'BT' || v_date_part || '-' || LPAD((v_count + 1)::TEXT, 3, '0');
  END;
  
  -- Get current stock
  SELECT stock_in_pieces INTO v_current_stock
  FROM products
  WHERE id = p_product_id;
  
  v_new_stock := v_current_stock + p_quantity;
  
  -- Calculate markup percentage if both prices provided
  IF p_purchase_price IS NOT NULL AND p_selling_price IS NOT NULL AND p_purchase_price > 0 THEN
    v_markup_percentage := ((p_selling_price - p_purchase_price) / p_purchase_price) * 100;
  ELSE
    v_markup_percentage := 0;
  END IF;
  
  -- Insert new batch
  INSERT INTO product_batches (
    product_id,
    batch_number,
    quantity,
    original_quantity,
    expiry_date,
    purchase_price,
    selling_price,
    markup_percentage,
    cost_per_unit,
    supplier_name,
    notes,
    status
  ) VALUES (
    p_product_id,
    v_batch_number,
    p_quantity,
    p_quantity,
    p_expiry_date,
    p_purchase_price,
    p_selling_price,
    v_markup_percentage,
    COALESCE(p_purchase_price, 0), -- Keep cost_per_unit for backward compatibility
    p_supplier_name,
    p_notes,
    'active'
  )
  RETURNING id INTO v_batch_id;
  
  -- Update product stock (but DON'T change the price - FIFO should show oldest batch price)
  UPDATE products
  SET 
    stock_in_pieces = v_new_stock,
    updated_at = NOW()
    -- REMOVED: price_per_piece update - let get_current_batch_price() handle pricing
  WHERE id = p_product_id;
  
  -- Update product price to reflect oldest batch (FIFO)
  PERFORM update_product_price_from_fifo(p_product_id);
  
  RETURN json_build_object(
    'success', true,
    'batch_id', v_batch_id,
    'batch_number', v_batch_number,
    'product_id', p_product_id,
    'quantity_added', p_quantity,
    'new_stock_level', v_new_stock,
    'purchase_price', p_purchase_price,
    'selling_price', p_selling_price,
    'markup_percentage', v_markup_percentage
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION add_product_batch IS 'Enhanced batch creation with purchase/selling price tracking';

-- ============================================================================
-- STEP 6: FIFO Sales Processing Stored Procedure
-- ============================================================================

CREATE OR REPLACE FUNCTION process_fifo_sale(
  p_sale_data JSON,
  p_sale_items JSON
)
RETURNS JSON AS $$
DECLARE
  v_sale_id UUID;
  v_item JSON;
  v_product_id UUID;
  v_quantity_needed INTEGER;
  v_quantity_remaining INTEGER;
  v_sale_item_id UUID;
  v_batch RECORD;
  v_quantity_to_take INTEGER;
  v_total_cogs NUMERIC := 0;
  v_total_revenue NUMERIC := 0;
  v_gross_profit NUMERIC := 0;
  v_profit_margin NUMERIC := 0;
BEGIN
  -- Create the main sale record
  INSERT INTO sales (
    user_id,
    total_amount,
    payment_method,
    customer_name,
    customer_phone,
    notes,
    discount_type,
    discount_percentage,
    discount_amount,
    subtotal_before_discount,
    pwd_senior_id,
    status,
    created_at
  )
  SELECT
    (p_sale_data->>'user_id')::UUID,
    (p_sale_data->>'total_amount')::NUMERIC,
    p_sale_data->>'payment_method',
    p_sale_data->>'customer_name',
    p_sale_data->>'customer_phone',
    p_sale_data->>'notes',
    COALESCE(p_sale_data->>'discount_type', 'none'),
    COALESCE((p_sale_data->>'discount_percentage')::NUMERIC, 0),
    COALESCE((p_sale_data->>'discount_amount')::NUMERIC, 0),
    COALESCE((p_sale_data->>'subtotal_before_discount')::NUMERIC, (p_sale_data->>'total_amount')::NUMERIC),
    p_sale_data->>'pwd_senior_id',
    'completed',
    NOW()
  RETURNING id INTO v_sale_id;
  
  -- Process each sale item with FIFO batch allocation
  FOR v_item IN SELECT * FROM json_array_elements(p_sale_items)
  LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_quantity_needed := (v_item->>'quantity')::INTEGER;
    v_quantity_remaining := v_quantity_needed;
    
    -- Create sale_item record
    INSERT INTO sale_items (
      sale_id,
      product_id,
      quantity,
      unit_type,
      unit_price,
      total_price
    )
    VALUES (
      v_sale_id,
      v_product_id,
      v_quantity_needed,
      v_item->>'unit_type',
      (v_item->>'unit_price')::NUMERIC,
      (v_item->>'total_price')::NUMERIC
    )
    RETURNING id INTO v_sale_item_id;
    
    -- FIFO: Allocate from oldest batches first
    FOR v_batch IN
      SELECT 
        pb.id,
        pb.quantity,
        COALESCE(pb.purchase_price, pb.cost_per_unit, 0) as purchase_price,
        COALESCE(pb.selling_price, p.price_per_piece) as selling_price
      FROM product_batches pb
      JOIN products p ON p.id = pb.product_id
      WHERE 
        pb.product_id = v_product_id
        AND pb.quantity > 0
        AND pb.status = 'active'
      ORDER BY pb.created_at ASC, pb.expiry_date ASC
    LOOP
      EXIT WHEN v_quantity_remaining <= 0;
      
      -- Take what we can from this batch
      v_quantity_to_take := LEAST(v_quantity_remaining, v_batch.quantity);
      
      -- Record the batch allocation
      INSERT INTO sale_batch_allocations (
        sale_id,
        sale_item_id,
        batch_id,
        product_id,
        quantity_sold,
        batch_purchase_price,
        batch_selling_price,
        item_cogs,
        item_revenue,
        item_profit
      )
      VALUES (
        v_sale_id,
        v_sale_item_id,
        v_batch.id,
        v_product_id,
        v_quantity_to_take,
        v_batch.purchase_price,
        v_batch.selling_price,
        v_quantity_to_take * v_batch.purchase_price,
        v_quantity_to_take * v_batch.selling_price,
        v_quantity_to_take * (v_batch.selling_price - v_batch.purchase_price)
      );
      
      -- Accumulate COGS and revenue
      v_total_cogs := v_total_cogs + (v_quantity_to_take * v_batch.purchase_price);
      v_total_revenue := v_total_revenue + (v_quantity_to_take * v_batch.selling_price);
      
      -- Deduct from batch
      UPDATE product_batches
      SET 
        quantity = quantity - v_quantity_to_take,
        status = CASE 
          WHEN quantity - v_quantity_to_take <= 0 THEN 'depleted'
          ELSE status
        END,
        updated_at = NOW()
      WHERE id = v_batch.id;
      
      v_quantity_remaining := v_quantity_remaining - v_quantity_to_take;
    END LOOP;
    
    -- Update product total stock
    UPDATE products
    SET 
      stock_in_pieces = stock_in_pieces - v_quantity_needed,
      updated_at = NOW()
    WHERE id = v_product_id;
    
    -- Update product price to reflect current oldest batch (after depletion)
    PERFORM update_product_price_from_fifo(v_product_id);
    
  END LOOP;
  
  -- Calculate profit metrics
  v_gross_profit := v_total_revenue - v_total_cogs;
  IF v_total_revenue > 0 THEN
    v_profit_margin := (v_gross_profit / v_total_revenue) * 100;
  END IF;
  
  -- Update sale with COGS and profit data
  UPDATE sales
  SET
    total_cogs = v_total_cogs,
    gross_profit = v_gross_profit,
    profit_margin_percentage = v_profit_margin
  WHERE id = v_sale_id;
  
  RETURN json_build_object(
    'success', true,
    'sale_id', v_sale_id,
    'total_cogs', v_total_cogs,
    'gross_profit', v_gross_profit,
    'profit_margin', v_profit_margin
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION process_fifo_sale IS 'Process sale with FIFO batch allocation and COGS tracking';

-- ============================================================================
-- STEP 7: Utility Functions
-- ============================================================================

-- Function to get all available batches for a product (for display/debugging)
CREATE OR REPLACE FUNCTION get_product_batches_fifo(p_product_id UUID)
RETURNS TABLE(
  batch_id BIGINT,
  batch_number TEXT,
  quantity INTEGER,
  purchase_price NUMERIC,
  selling_price NUMERIC,
  markup_percentage NUMERIC,
  expiry_date DATE,
  created_at TIMESTAMPTZ,
  status VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pb.id,
    pb.batch_number,
    pb.quantity,
    COALESCE(pb.purchase_price, pb.cost_per_unit, 0),
    COALESCE(pb.selling_price, p.price_per_piece),
    COALESCE(pb.markup_percentage, 0),
    pb.expiry_date,
    pb.created_at,
    pb.status
  FROM product_batches pb
  JOIN products p ON p.id = pb.product_id
  WHERE pb.product_id = p_product_id
  ORDER BY pb.created_at ASC, pb.expiry_date ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to get sale profit details
CREATE OR REPLACE FUNCTION get_sale_profit_details(p_sale_id UUID)
RETURNS TABLE(
  product_name TEXT,
  batch_number TEXT,
  quantity_sold INTEGER,
  purchase_price NUMERIC,
  selling_price NUMERIC,
  item_cogs NUMERIC,
  item_revenue NUMERIC,
  item_profit NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.generic_name || COALESCE(' (' || p.brand_name || ')', ''),
    pb.batch_number,
    sba.quantity_sold,
    sba.batch_purchase_price,
    sba.batch_selling_price,
    sba.item_cogs,
    sba.item_revenue,
    sba.item_profit
  FROM sale_batch_allocations sba
  JOIN products p ON p.id = sba.product_id
  JOIN product_batches pb ON pb.id = sba.batch_id
  WHERE sba.sale_id = p_sale_id
  ORDER BY sba.created_at;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 8: Update Existing Batches with Default Prices (Backward Compatibility)
-- ============================================================================

-- For existing batches without selling_price, use product's price_per_piece
UPDATE product_batches pb
SET 
  selling_price = p.price_per_piece,
  purchase_price = COALESCE(pb.cost_per_unit, 0)
FROM products p
WHERE pb.product_id = p.id
  AND pb.selling_price IS NULL;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$ 
BEGIN
  RAISE NOTICE '✅ FIFO Batch Pricing System Migration Complete!';
  RAISE NOTICE '📦 Added pricing columns to product_batches';
  RAISE NOTICE '💰 Added COGS tracking to sales';
  RAISE NOTICE '📊 Created sale_batch_allocations table';
  RAISE NOTICE '🔧 Created get_current_batch_price() function';
  RAISE NOTICE '🔧 Created process_fifo_sale() function';
  RAISE NOTICE '🔧 Created utility functions for profit tracking';
END $$;
