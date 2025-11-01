-- ============================================================================
-- FIFO BATCH-BASED PRICING SYSTEM - UPDATE
-- Fixes: 1) Batch number format (BT101325-001)
--        2) Product price should always show oldest batch (FIFO)
-- Run this AFTER the initial migration
-- ============================================================================

-- ============================================================================
-- FIX 1: Add function to update product price from oldest batch
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
-- FIX 2: Update add_product_batch with correct batch format and FIFO pricing
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
  
  -- Get count of batches created today for this product
  SELECT COUNT(*) INTO v_count
  FROM product_batches
  WHERE product_id = p_product_id
    AND DATE(created_at) = CURRENT_DATE;
  
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
  
  -- Update product stock
  UPDATE products
  SET 
    stock_in_pieces = v_new_stock,
    updated_at = NOW()
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

-- ============================================================================
-- FIX 3: Update process_fifo_sale to maintain FIFO pricing after sales
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

-- ============================================================================
-- FIX 4: Add trigger to auto-update price when batch quantity changes
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_update_product_price_on_batch_change()
RETURNS TRIGGER AS $$
BEGIN
  -- When batch quantity changes (depletion during sale)
  IF (OLD.quantity > 0 AND NEW.quantity = 0) OR (OLD.status != NEW.status) THEN
    -- Update product price to next oldest batch
    PERFORM update_product_price_from_fifo(NEW.product_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trg_update_price_on_batch_depletion ON product_batches;

-- Create trigger on batch updates
CREATE TRIGGER trg_update_price_on_batch_depletion
  AFTER UPDATE ON product_batches
  FOR EACH ROW
  WHEN (OLD.quantity IS DISTINCT FROM NEW.quantity OR OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION trigger_update_product_price_on_batch_change();

COMMENT ON TRIGGER trg_update_price_on_batch_depletion ON product_batches IS 'Auto-updates product price when batch depletes (FIFO)';

-- ============================================================================
-- FIX 5: Manual function to refresh all product prices
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_all_product_prices()
RETURNS JSON AS $$
DECLARE
  v_product RECORD;
  v_count INTEGER := 0;
BEGIN
  FOR v_product IN 
    SELECT DISTINCT product_id 
    FROM product_batches 
    WHERE quantity > 0 AND status = 'active'
  LOOP
    PERFORM update_product_price_from_fifo(v_product.product_id);
    v_count := v_count + 1;
  END LOOP;
  
  RETURN json_build_object(
    'success', true,
    'products_updated', v_count,
    'message', 'All product prices synced with oldest batches (FIFO)'
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_all_product_prices IS 'Manually refresh all product prices to match oldest batch (useful for troubleshooting)';

-- Run initial sync
DO $$
DECLARE
  v_result JSON;
BEGIN
  SELECT refresh_all_product_prices() INTO v_result;
  RAISE NOTICE '✅ %', v_result->>'message';
  RAISE NOTICE '📊 Products updated: %', v_result->>'products_updated';
END $$;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ ═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ FIFO BATCH PRICING SYSTEM - ENHANCED UPDATE COMPLETE!';
  RAISE NOTICE '✅ ═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 FIXES APPLIED:';
  RAISE NOTICE '   1. Batch format: BT101325-001 (BT + MMDDYY + sequential)';
  RAISE NOTICE '   2. Product price always shows OLDEST batch (FIFO)';
  RAISE NOTICE '   3. Price auto-updates when oldest batch depletes';
  RAISE NOTICE '   4. Database trigger ensures price sync on batch changes';
  RAISE NOTICE '   5. Manual refresh function available for troubleshooting';
  RAISE NOTICE '';
  RAISE NOTICE '📋 AVAILABLE FUNCTIONS:';
  RAISE NOTICE '   • update_product_price_from_fifo(product_id) - Sync single product';
  RAISE NOTICE '   • refresh_all_product_prices() - Sync all products';
  RAISE NOTICE '   • add_product_batch(...) - Add batch with auto-price sync';
  RAISE NOTICE '   • process_fifo_sale(...) - Process sale with FIFO + price update';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 HOW IT WORKS:';
  RAISE NOTICE '   • Add new batch → Price shows oldest batch';
  RAISE NOTICE '   • Sell from oldest → Batch depletes → Trigger fires → Price updates to next oldest';
  RAISE NOTICE '   • If stuck → Call refresh_all_product_prices() to force sync';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Ready to use! Test by adding batches with different prices.';
  RAISE NOTICE '';
END $$;
