-- ============================================================================
-- INTEGRATE FIFO WITH EXISTING SALES SYSTEM
-- ============================================================================
-- This makes your existing create_sale_with_items function FIFO-compatible
-- ============================================================================

-- ============================================================================
-- DROP ALL EXISTING VERSIONS OF create_sale_with_items
-- ============================================================================

-- Nuclear option: Drop ALL versions regardless of signature
DO $$
DECLARE
  v_func RECORD;
  v_drop_sql TEXT;
BEGIN
  RAISE NOTICE 'Searching for all create_sale_with_items functions...';
  
  FOR v_func IN 
    SELECT 
      p.oid::regprocedure::text as full_signature
    FROM pg_proc p
    WHERE p.proname = 'create_sale_with_items'
  LOOP
    v_drop_sql := 'DROP FUNCTION IF EXISTS ' || v_func.full_signature || ' CASCADE';
    RAISE NOTICE 'Dropping: %', v_func.full_signature;
    EXECUTE v_drop_sql;
  END LOOP;
  
  RAISE NOTICE '✅ All versions of create_sale_with_items dropped';
END $$;

-- ============================================================================
-- CREATE NEW FIFO-COMPATIBLE VERSION
-- ============================================================================

CREATE FUNCTION create_sale_with_items(
  sale_data JSON,
  sale_items JSON
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
  v_product_current_stock INTEGER;
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
    (sale_data->>'user_id')::UUID,
    (sale_data->>'total_amount')::NUMERIC,
    sale_data->>'payment_method',
    sale_data->>'customer_name',
    sale_data->>'customer_phone',
    sale_data->>'notes',
    COALESCE(sale_data->>'discount_type', 'none'),
    COALESCE((sale_data->>'discount_percentage')::NUMERIC, 0),
    COALESCE((sale_data->>'discount_amount')::NUMERIC, 0),
    COALESCE((sale_data->>'subtotal_before_discount')::NUMERIC, (sale_data->>'total_amount')::NUMERIC),
    sale_data->>'pwd_senior_id',
    'completed',
    NOW()
  RETURNING id INTO v_sale_id;
  
  -- Process each sale item with FIFO batch allocation
  FOR v_item IN SELECT * FROM json_array_elements(sale_items)
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
    
    -- Get current product stock
    SELECT stock_in_pieces INTO v_product_current_stock
    FROM products
    WHERE id = v_product_id;
    
    -- ============================================================================
    -- 🔥 FIFO BATCH ALLOCATION - DEDUCT FROM OLDEST BATCHES FIRST
    -- ============================================================================
    FOR v_batch IN
      SELECT 
        pb.id,
        pb.batch_number,
        pb.quantity,
        COALESCE(pb.purchase_price, pb.cost_per_unit, 0) as purchase_price,
        COALESCE(pb.selling_price, p.price_per_piece) as selling_price
      FROM product_batches pb
      JOIN products p ON p.id = pb.product_id
      WHERE 
        pb.product_id = v_product_id
        AND pb.quantity > 0
        AND pb.status = 'active'
      ORDER BY pb.created_at ASC, pb.expiry_date ASC  -- FIFO: Oldest first
    LOOP
      EXIT WHEN v_quantity_remaining <= 0;
      
      -- Take what we can from this batch
      v_quantity_to_take := LEAST(v_quantity_remaining, v_batch.quantity);
      
      -- Record the batch allocation (for COGS tracking)
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
      
      -- ============================================================================
      -- 🔥 CRITICAL: UPDATE BATCH QUANTITY (This will trigger price update)
      -- ============================================================================
      UPDATE product_batches
      SET 
        quantity = quantity - v_quantity_to_take,
        status = CASE 
          WHEN quantity - v_quantity_to_take <= 0 THEN 'depleted'
          ELSE 'active'
        END,
        updated_at = NOW()
      WHERE id = v_batch.id;
      
      -- Log for debugging
      RAISE NOTICE 'Sold % units from batch % (% remaining)', 
        v_quantity_to_take, 
        v_batch.batch_number,
        (v_batch.quantity - v_quantity_to_take);
      
      v_quantity_remaining := v_quantity_remaining - v_quantity_to_take;
    END LOOP;
    
    -- Update product total stock
    UPDATE products
    SET 
      stock_in_pieces = stock_in_pieces - v_quantity_needed,
      updated_at = NOW()
    WHERE id = v_product_id;
    
    -- ============================================================================
    -- 🔥 TRIGGER WILL AUTO-FIRE HERE when batch quantity=0
    -- This updates product price to next oldest batch
    -- ============================================================================
    
  END LOOP;
  
  -- Calculate profit metrics
  DECLARE
    v_gross_profit NUMERIC;
    v_profit_margin NUMERIC;
  BEGIN
    v_gross_profit := v_total_revenue - v_total_cogs;
    IF v_total_revenue > 0 THEN
      v_profit_margin := (v_gross_profit / v_total_revenue) * 100;
    ELSE
      v_profit_margin := 0;
    END IF;
    
    -- Update sale with COGS and profit data
    UPDATE sales
    SET
      total_cogs = v_total_cogs,
      gross_profit = v_gross_profit,
      profit_margin_percentage = v_profit_margin
    WHERE id = v_sale_id;
  END;
  
  RETURN json_build_object(
    'success', true,
    'sale_id', v_sale_id,
    'id', v_sale_id,
    'total_cogs', v_total_cogs,
    'gross_profit', v_total_revenue - v_total_cogs
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_sale_with_items IS 'Creates sale with FIFO batch tracking and auto-price updates';

-- ============================================================================
-- COMPLETION
-- ============================================================================

DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ ═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ FIFO INTEGRATION COMPLETE!';
  RAISE NOTICE '✅ ═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 WHAT CHANGED:';
  RAISE NOTICE '   • create_sale_with_items now uses FIFO batch allocation';
  RAISE NOTICE '   • Batches deducted from oldest first';
  RAISE NOTICE '   • Batch status updates to "depleted" when empty';
  RAISE NOTICE '   • Trigger auto-fires to update product price';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 WHAT HAPPENS NOW:';
  RAISE NOTICE '   1. Customer buys product';
  RAISE NOTICE '   2. System deducts from oldest batch';
  RAISE NOTICE '   3. If batch empties → status = "depleted"';
  RAISE NOTICE '   4. Trigger detects status change';
  RAISE NOTICE '   5. Product price updates to next oldest batch';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Your POS will now auto-update prices on batch depletion!';
  RAISE NOTICE '';
END $$;
