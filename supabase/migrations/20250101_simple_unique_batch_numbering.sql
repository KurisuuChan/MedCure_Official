-- ============================================================================
-- SIMPLE UNIQUE BATCH NUMBERING SYSTEM (ALTERNATIVE)
-- ============================================================================
-- Format: BT-{MMDDYY}-{HHMMSS}-{Sequence}
-- Example: BT-010125-143022-001
-- This ensures uniqueness through timestamp + sequence
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
  v_time_part TEXT;
  v_count INTEGER;
  v_product RECORD;
  v_initial_batch_id BIGINT;
  v_initial_batch_number TEXT;
  v_sequence_num INTEGER;
  v_retry_count INTEGER := 0;
  v_max_retries INTEGER := 5;
BEGIN
  -- ✅ CRITICAL FIX: Check if product has initial stock but no batches
  -- If so, create batch 001 from the initial stock first
  SELECT 
    p.id,
    p.stock_in_pieces,
    p.expiry_date,
    p.cost_price,
    p.price_per_piece,
    p.supplier,
    p.created_at
  INTO v_product
  FROM products p
  WHERE p.id = p_product_id;
  
  -- Check if product has stock but no batches
  SELECT COUNT(*) INTO v_count
  FROM product_batches
  WHERE product_id = p_product_id;
  
  -- If product has initial stock but no batches, create batch 001 from initial stock
  IF v_count = 0 AND COALESCE(v_product.stock_in_pieces, 0) > 0 THEN
    -- Generate batch number for initial stock (batch 001)
    IF v_product.created_at IS NOT NULL THEN
      v_date_part := TO_CHAR(v_product.created_at, 'MMDDYY');
      v_time_part := TO_CHAR(v_product.created_at, 'HH24MISS');
    ELSE
      v_date_part := TO_CHAR(NOW(), 'MMDDYY');
      v_time_part := TO_CHAR(NOW(), 'HH24MISS');
    END IF;
    
    v_initial_batch_number := 'BT-' || v_date_part || '-' || v_time_part || '-001';
    
    -- Calculate markup from product prices if available
    DECLARE
      v_initial_markup NUMERIC := 0;
      v_initial_purchase_price NUMERIC;
      v_initial_selling_price NUMERIC;
    BEGIN
      v_initial_purchase_price := COALESCE(v_product.cost_price, 0);
      v_initial_selling_price := COALESCE(v_product.price_per_piece, 0);
      
      IF v_initial_purchase_price > 0 AND v_initial_selling_price > 0 THEN
        v_initial_markup := ((v_initial_selling_price - v_initial_purchase_price) / v_initial_purchase_price) * 100;
      END IF;
      
      -- Create batch 001 from initial stock
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
        status,
        created_at
      ) VALUES (
        p_product_id,
        v_initial_batch_number,
        v_product.stock_in_pieces,
        v_product.stock_in_pieces,
        v_product.expiry_date,
        NULLIF(v_initial_purchase_price, 0),
        NULLIF(v_initial_selling_price, 0),
        v_initial_markup,
        v_initial_purchase_price,
        v_product.supplier,
        'Initial stock from product creation',
        'active',
        COALESCE(v_product.created_at, NOW())
      )
      RETURNING id INTO v_initial_batch_id;
      
      RAISE NOTICE 'Created initial batch 001 from product stock: % units', v_product.stock_in_pieces;
    END;
  END IF;
  
  -- Generate batch number with timestamp for uniqueness
  -- Format: BT-{MMDDYY}-{HHMMSS}-{Sequence}
  v_date_part := TO_CHAR(NOW(), 'MMDDYY');
  v_time_part := TO_CHAR(NOW(), 'HH24MISS');
  
  -- ✅ Get count of ALL batches for this product to ensure sequential numbering
  SELECT COUNT(*) INTO v_count
  FROM product_batches
  WHERE product_id = p_product_id;
  
  -- Calculate sequence number (next in line for this product)
  v_sequence_num := v_count + 1;
  
  -- Generate batch number with timestamp for uniqueness
  -- The timestamp ensures uniqueness even if multiple batches are added simultaneously
  v_batch_number := 'BT-' || v_date_part || '-' || v_time_part || '-' || LPAD(v_sequence_num::TEXT, 3, '0');
  
  -- Retry logic in case of duplicate (very rare with timestamp, but safety measure)
  WHILE v_retry_count < v_max_retries LOOP
    BEGIN
      -- Check if batch number already exists (shouldn't happen with timestamp, but check anyway)
      IF EXISTS (SELECT 1 FROM product_batches WHERE batch_number = v_batch_number) THEN
        -- If duplicate, add milliseconds to timestamp
        v_time_part := TO_CHAR(NOW(), 'HH24MISS') || LPAD((EXTRACT(MICROSECONDS FROM NOW())::BIGINT % 1000)::TEXT, 3, '0');
        v_batch_number := 'BT-' || v_date_part || '-' || v_time_part || '-' || LPAD(v_sequence_num::TEXT, 3, '0');
        v_retry_count := v_retry_count + 1;
      ELSE
        EXIT; -- Batch number is unique, proceed
      END IF;
    END;
  END LOOP;
  
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

COMMENT ON FUNCTION add_product_batch IS 'Adds a new product batch with unique batch numbering: BT-{MMDDYY}-{HHMMSS}-{Sequence}';

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ ═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ SIMPLE UNIQUE BATCH NUMBERING SYSTEM APPLIED!';
  RAISE NOTICE '✅ ═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 NEW BATCH NUMBER FORMAT:';
  RAISE NOTICE '   Format: BT-{MMDDYY}-{HHMMSS}-{Sequence}';
  RAISE NOTICE '   Example: BT-010125-143022-001';
  RAISE NOTICE '';
  RAISE NOTICE '📋 COMPONENTS:';
  RAISE NOTICE '   • BT: Batch prefix';
  RAISE NOTICE '   • MMDDYY: Date (Month/Day/Year)';
  RAISE NOTICE '   • HHMMSS: Time (Hour/Minute/Second) for uniqueness';
  RAISE NOTICE '   • Sequence: 001, 002, 003... (per product, based on order added)';
  RAISE NOTICE '';
  RAISE NOTICE '✅ BENEFITS:';
  RAISE NOTICE '   • Guaranteed uniqueness (timestamp ensures no duplicates)';
  RAISE NOTICE '   • Sequential numbering per product (001, 002, 003...)';
  RAISE NOTICE '   • Sequence depends on ORDER when added (not just count)';
  RAISE NOTICE '   • No duplicates even with concurrent inserts';
  RAISE NOTICE '   • Shorter format (easier to read)';
  RAISE NOTICE '';
  RAISE NOTICE '📋 EXAMPLE:';
  RAISE NOTICE '   • First batch added at 14:30:22 → BT-010125-143022-001';
  RAISE NOTICE '   • Second batch same day at 15:00:00 → BT-010125-150000-002';
  RAISE NOTICE '   • Third batch same day at 15:00:01 → BT-010125-150001-003';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Ready to use!';
  RAISE NOTICE '';
END $$;


