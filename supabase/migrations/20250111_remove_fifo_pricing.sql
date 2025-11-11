-- ============================================================================
-- REMOVE FIFO PRICING - KEEP FIFO FOR EXPIRY ONLY
-- Purpose: Remove automatic price updates based on oldest batch
--          Keep FIFO logic for batch selection during sales (expiry-based)
-- Date: November 11, 2025
-- ============================================================================

-- ============================================================================
-- STEP 1: Remove the FIFO price update function (replace with no-op)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_product_price_from_fifo(p_product_id UUID)
RETURNS VOID AS $$
BEGIN
  -- No longer update prices based on FIFO
  -- Prices are now managed manually in the products table
  -- This function is kept as a no-op to avoid breaking existing code
  RETURN;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_product_price_from_fifo IS 'DEPRECATED: No longer updates prices. Kept for compatibility.';

-- ============================================================================
-- STEP 2: Update add_product_batch to NOT update prices
-- ============================================================================

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
  v_date_part TEXT;
  v_count INTEGER;
BEGIN
  -- Generate batch number in format: BT + MMDDYY + sequential number
  v_date_part := TO_CHAR(NOW(), 'MMDDYY');
  
  -- Get count of ALL batches for this product (not just today) to ensure sequential numbering
  SELECT COUNT(*) INTO v_count
  FROM product_batches
  WHERE product_id = p_product_id;
  
  v_batch_number := 'BT' || v_date_part || '-' || LPAD((v_count + 1)::TEXT, 3, '0');
  
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
    COALESCE(p_purchase_price, 0),
    p_supplier_name,
    p_notes,
    'active'
  )
  RETURNING id INTO v_batch_id;
  
  -- Update product stock (but NOT price - price stays as set in products table)
  UPDATE products
  SET 
    stock_in_pieces = v_new_stock,
    updated_at = NOW()
  WHERE id = p_product_id;
  
  -- REMOVED: FIFO price update - prices are now managed separately
  -- Product price_per_piece remains unchanged
  
  RETURN json_build_object(
    'success', true,
    'batch_id', v_batch_id,
    'batch_number', v_batch_number,
    'product_id', p_product_id,
    'quantity_added', p_quantity,
    'new_stock_level', v_new_stock,
    'purchase_price', p_purchase_price,
    'selling_price', p_selling_price,
    'markup_percentage', v_markup_percentage,
    'note', 'Product price remains unchanged - manage prices in products table'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION add_product_batch IS 'Adds product batch with FIFO expiry tracking. Does NOT update product prices.';

-- ============================================================================
-- STEP 3: Update process_fifo_sale - Keep FIFO for expiry, remove price updates
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
  v_product_price NUMERIC;
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
  
  -- Process each sale item with FIFO batch allocation (EXPIRY-BASED ONLY)
  FOR v_item IN SELECT * FROM json_array_elements(p_sale_items)
  LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_quantity_needed := (v_item->>'quantity')::INTEGER;
    v_quantity_remaining := v_quantity_needed;
    
    -- Get the product's current selling price (used for revenue calculation)
    SELECT price_per_piece INTO v_product_price
    FROM products
    WHERE id = v_product_id;
    
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
    
    -- FIFO: Allocate from oldest batches by EXPIRY DATE (not price)
    -- Priority: Earlier expiry dates first, then creation date
    FOR v_batch IN
      SELECT 
        pb.id,
        pb.quantity,
        COALESCE(pb.purchase_price, pb.cost_per_unit, 0) as purchase_price,
        pb.expiry_date
      FROM product_batches pb
      WHERE 
        pb.product_id = v_product_id
        AND pb.quantity > 0
        AND pb.status = 'active'
      ORDER BY 
        -- FIFO by expiry date first (items expiring soonest)
        COALESCE(pb.expiry_date, '9999-12-31'::date) ASC,
        -- Then by creation date (oldest first)
        pb.created_at ASC
    LOOP
      EXIT WHEN v_quantity_remaining <= 0;
      
      -- Take what we can from this batch
      v_quantity_to_take := LEAST(v_quantity_remaining, v_batch.quantity);
      
      -- Record the batch allocation
      -- Revenue is calculated using the product's price, NOT the batch price
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
        v_product_price, -- Use product's current price, not batch price
        v_quantity_to_take * v_batch.purchase_price,
        v_quantity_to_take * v_product_price, -- Use product's current price
        v_quantity_to_take * (v_product_price - v_batch.purchase_price)
      );
      
      -- Accumulate COGS and revenue
      v_total_cogs := v_total_cogs + (v_quantity_to_take * v_batch.purchase_price);
      v_total_revenue := v_total_revenue + (v_quantity_to_take * v_product_price);
      
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
    
    -- Update product total stock (but NOT price)
    UPDATE products
    SET 
      stock_in_pieces = stock_in_pieces - v_quantity_needed,
      updated_at = NOW()
    WHERE id = v_product_id;
    
    -- REMOVED: Price update - prices are now managed separately
    -- Product price_per_piece remains unchanged after sales
    
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
    'profit_margin', v_profit_margin,
    'note', 'FIFO applied by expiry date only - prices managed separately'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION process_fifo_sale IS 'Process sale with FIFO by expiry date. Does NOT update product prices.';

-- ============================================================================
-- STEP 4: Update trigger to NOT update prices
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_update_product_price_on_batch_change()
RETURNS TRIGGER AS $$
BEGIN
  -- This trigger is kept for compatibility but does nothing now
  -- Prices are managed manually in the products table
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION trigger_update_product_price_on_batch_change IS 'DEPRECATED: No longer updates prices. Kept for compatibility.';

-- ============================================================================
-- STEP 5: Update refresh function (make it a no-op)
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_all_product_prices()
RETURNS JSON AS $$
BEGIN
  RETURN json_build_object(
    'success', true,
    'products_updated', 0,
    'message', 'Price auto-update disabled. Manage prices manually in products table.'
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_all_product_prices IS 'DEPRECATED: No longer updates prices. Manage prices in products table.';

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ ═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ FIFO PRICING REMOVED - EXPIRY-BASED FIFO RETAINED';
  RAISE NOTICE '✅ ═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 CHANGES APPLIED:';
  RAISE NOTICE '   ✓ Product prices NO LONGER auto-update from batches';
  RAISE NOTICE '   ✓ FIFO logic KEPT for batch selection (by expiry date)';
  RAISE NOTICE '   ✓ Sales still use oldest batches first (expiring soonest)';
  RAISE NOTICE '   ✓ Prices managed manually in products table';
  RAISE NOTICE '   ✓ Batch prices stored for cost tracking only';
  RAISE NOTICE '';
  RAISE NOTICE '📋 HOW IT WORKS NOW:';
  RAISE NOTICE '   • Product price = Set manually in products.price_per_piece';
  RAISE NOTICE '   • Batch prices = Stored for COGS/profit tracking';
  RAISE NOTICE '   • FIFO selection = By expiry date (oldest/soonest first)';
  RAISE NOTICE '   • Sales deduct from batches expiring soonest';
  RAISE NOTICE '   • Profit margins calculated using batch COGS vs product price';
  RAISE NOTICE '';
  RAISE NOTICE '💡 MIGRATION NOTES:';
  RAISE NOTICE '   • Existing product prices remain unchanged';
  RAISE NOTICE '   • Update prices manually as needed';
  RAISE NOTICE '   • Batch tracking continues normally';
  RAISE NOTICE '   • COGS and profit calculations still accurate';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Ready to use! Prices are now independent of FIFO.';
  RAISE NOTICE '';
END $$;
