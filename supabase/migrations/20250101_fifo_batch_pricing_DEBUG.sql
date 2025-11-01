-- ============================================================================
-- FIFO BATCH PRICING - DIAGNOSTIC & FIX
-- ============================================================================
-- Run this to diagnose and fix the price update issue

-- ============================================================================
-- 1. Check if trigger exists
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trg_update_price_on_batch_depletion'
  ) THEN
    RAISE NOTICE '✅ Trigger exists: trg_update_price_on_batch_depletion';
  ELSE
    RAISE NOTICE '❌ Trigger NOT found!';
  END IF;
END $$;

-- ============================================================================
-- 2. Check current batch and product prices
-- ============================================================================

DO $$
DECLARE
  v_product RECORD;
  v_oldest_batch RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📊 CURRENT STATE CHECK:';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  
  FOR v_product IN 
    SELECT 
      p.id,
      p.name,
      p.price_per_piece as current_price,
      p.stock_in_pieces
    FROM products p
    WHERE p.stock_in_pieces > 0
    LIMIT 5
  LOOP
    -- Get oldest batch for this product
    SELECT 
      batch_number,
      quantity,
      selling_price,
      status,
      created_at
    INTO v_oldest_batch
    FROM product_batches
    WHERE 
      product_id = v_product.id
      AND quantity > 0
      AND status = 'active'
    ORDER BY created_at ASC, expiry_date ASC
    LIMIT 1;
    
    IF FOUND THEN
      RAISE NOTICE 'Product: % (Stock: %)', v_product.name, v_product.stock_in_pieces;
      RAISE NOTICE '  Current Price: ₱%', v_product.current_price;
      RAISE NOTICE '  Oldest Batch: % (Qty: %, Price: ₱%)', 
        v_oldest_batch.batch_number, 
        v_oldest_batch.quantity,
        v_oldest_batch.selling_price;
      
      IF v_product.current_price != v_oldest_batch.selling_price THEN
        RAISE NOTICE '  ⚠️  MISMATCH! Product price should be ₱%', v_oldest_batch.selling_price;
      ELSE
        RAISE NOTICE '  ✅ Prices match!';
      END IF;
      RAISE NOTICE '';
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- 3. Enhanced trigger with logging
-- ============================================================================

-- Drop old trigger
DROP TRIGGER IF EXISTS trg_update_price_on_batch_depletion ON product_batches;

-- Create enhanced trigger function with better logic
CREATE OR REPLACE FUNCTION trigger_update_product_price_on_batch_change()
RETURNS TRIGGER AS $$
DECLARE
  v_was_active BOOLEAN;
  v_is_depleted BOOLEAN;
BEGIN
  -- Check if batch went from having stock to being depleted
  v_was_active := (OLD.quantity > 0 AND OLD.status = 'active');
  v_is_depleted := (NEW.quantity = 0 OR NEW.status = 'depleted');
  
  -- If an active batch just depleted, update product price
  IF v_was_active AND v_is_depleted THEN
    -- Update product price to next oldest batch
    PERFORM update_product_price_from_fifo(NEW.product_id);
    
    -- Log the update (you'll see this in Supabase logs)
    RAISE NOTICE 'Trigger fired: Batch % depleted, updating product price', NEW.batch_number;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trg_update_price_on_batch_depletion
  AFTER UPDATE ON product_batches
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_product_price_on_batch_change();

COMMENT ON TRIGGER trg_update_price_on_batch_depletion ON product_batches IS 'Auto-updates product price when batch depletes (FIFO)';

-- ============================================================================
-- 4. Fix update_product_price_from_fifo to handle edge cases
-- ============================================================================

CREATE OR REPLACE FUNCTION update_product_price_from_fifo(p_product_id UUID)
RETURNS VOID AS $$
DECLARE
  v_oldest_batch RECORD;
  v_current_price NUMERIC;
BEGIN
  -- Get current product price
  SELECT price_per_piece INTO v_current_price
  FROM products
  WHERE id = p_product_id;
  
  -- Get the oldest active batch with stock
  SELECT 
    selling_price,
    purchase_price,
    batch_number
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
    IF v_current_price != v_oldest_batch.selling_price THEN
      UPDATE products
      SET 
        price_per_piece = v_oldest_batch.selling_price,
        updated_at = NOW()
      WHERE id = p_product_id;
      
      RAISE NOTICE 'Updated product price: ₱% → ₱% (Batch: %)', 
        v_current_price, 
        v_oldest_batch.selling_price,
        v_oldest_batch.batch_number;
    END IF;
  ELSE
    -- No active batches, keep current price
    RAISE NOTICE 'No active batches found for product %', p_product_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_product_price_from_fifo IS 'Updates product selling price to match oldest available batch (FIFO)';

-- ============================================================================
-- 5. Manual refresh all prices NOW
-- ============================================================================

DO $$
DECLARE
  v_result JSON;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔄 Running manual price refresh for all products...';
  SELECT refresh_all_product_prices() INTO v_result;
  RAISE NOTICE '✅ %', v_result->>'message';
  RAISE NOTICE '📊 Products updated: %', v_result->>'products_updated';
END $$;

-- ============================================================================
-- 6. Test the trigger manually
-- ============================================================================

DO $$
DECLARE
  v_test_batch RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🧪 TRIGGER TEST:';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  
  -- Find a batch with stock to test
  SELECT 
    id,
    product_id,
    batch_number,
    quantity
  INTO v_test_batch
  FROM product_batches
  WHERE quantity > 1 AND status = 'active'
  LIMIT 1;
  
  IF FOUND THEN
    RAISE NOTICE 'Found test batch: % (Qty: %)', v_test_batch.batch_number, v_test_batch.quantity;
    RAISE NOTICE 'To test trigger, reduce quantity in your app and watch logs';
  ELSE
    RAISE NOTICE 'No batches available for testing';
  END IF;
END $$;

-- ============================================================================
-- COMPLETION
-- ============================================================================

DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ ═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ DIAGNOSTIC & FIX COMPLETE';
  RAISE NOTICE '✅ ═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '🔍 What was checked:';
  RAISE NOTICE '   1. Trigger existence verified';
  RAISE NOTICE '   2. Current product vs batch prices compared';
  RAISE NOTICE '   3. Enhanced trigger with better logic installed';
  RAISE NOTICE '   4. Function updated with logging';
  RAISE NOTICE '   5. Manual refresh executed';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Next steps:';
  RAISE NOTICE '   1. Check the output above for any mismatches';
  RAISE NOTICE '   2. Try selling to deplete a batch';
  RAISE NOTICE '   3. Check Supabase logs for trigger messages';
  RAISE NOTICE '   4. Use refresh button if needed';
  RAISE NOTICE '';
END $$;
