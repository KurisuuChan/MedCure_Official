-- =====================================================
-- PRODUCT VARIANTS SYSTEM - DATABASE UPDATE
-- =====================================================
-- Add variant support for box, piece, sheet to products

-- Add variant columns to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit_type TEXT DEFAULT 'piece' CHECK (unit_type IN ('piece', 'box', 'sheet'));
ALTER TABLE products ADD COLUMN IF NOT EXISTS pieces_per_box INTEGER DEFAULT 1;
ALTER TABLE products ADD COLUMN IF NOT EXISTS pieces_per_sheet INTEGER DEFAULT 1;
ALTER TABLE products ADD COLUMN IF NOT EXISTS box_price DECIMAL(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS sheet_price DECIMAL(10,2);

-- Update existing products to have proper variant data
UPDATE products SET 
    unit_type = 'piece',
    pieces_per_box = 12,
    pieces_per_sheet = 1,
    box_price = selling_price * 12 * 0.9, -- 10% discount for bulk
    sheet_price = selling_price
WHERE unit_type IS NULL OR unit_type = '';

-- Update process_sale function to handle variants
DROP FUNCTION IF EXISTS process_sale(JSONB, TEXT, TEXT);
CREATE OR REPLACE FUNCTION process_sale(
    p_items JSONB,
    p_customer_name TEXT DEFAULT 'Walk-in Customer',
    p_payment_method TEXT DEFAULT 'cash'
)
RETURNS JSON AS $$
DECLARE
    v_sale_id UUID;
    v_item JSONB;
    v_product products%ROWTYPE;
    v_total_amount DECIMAL := 0;
    v_generated_sale_number TEXT;
    v_sale_count INTEGER;
    v_variant_type TEXT;
    v_quantity_in_pieces INTEGER;
    v_unit_price DECIMAL;
BEGIN
    -- Generate unique sale number
    SELECT COUNT(*) INTO v_sale_count
    FROM sales 
    WHERE DATE(created_at) = CURRENT_DATE;
    
    v_generated_sale_number := 'SALE-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                              LPAD((v_sale_count + 1)::TEXT, 4, '0');
    
    -- Create main sale record
    INSERT INTO sales (
        sale_number,
        customer_name,
        total_amount,
        payment_method,
        sale_date,
        created_by
    ) VALUES (
        v_generated_sale_number,
        p_customer_name,
        0, -- Will update after calculating total
        p_payment_method,
        CURRENT_DATE,
        auth.uid()
    ) RETURNING id INTO v_sale_id;
    
    -- Process each item with variant support
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        -- Get product details
        SELECT * INTO v_product 
        FROM products 
        WHERE id = (v_item->>'product_id')::UUID;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product not found: %', v_item->>'product_id';
        END IF;
        
        -- Get variant type and calculate pieces needed
        v_variant_type := COALESCE(v_item->>'variant', 'piece');
        
        CASE v_variant_type
            WHEN 'box' THEN
                v_quantity_in_pieces := (v_item->>'quantity')::INTEGER * v_product.pieces_per_box;
                v_unit_price := v_product.box_price;
            WHEN 'sheet' THEN
                v_quantity_in_pieces := (v_item->>'quantity')::INTEGER * v_product.pieces_per_sheet;
                v_unit_price := v_product.sheet_price;
            ELSE -- piece
                v_quantity_in_pieces := (v_item->>'quantity')::INTEGER;
                v_unit_price := v_product.selling_price;
        END CASE;
        
        -- Check stock availability (always in pieces)
        IF v_product.stock_quantity < v_quantity_in_pieces THEN
            RAISE EXCEPTION 'Insufficient stock for product: % (need % pieces, have %)', 
                v_product.name, v_quantity_in_pieces, v_product.stock_quantity;
        END IF;
        
        -- Create sale item
        INSERT INTO sale_items (
            sale_id,
            product_id,
            quantity,
            unit_price,
            total_price
        ) VALUES (
            v_sale_id,
            v_product.id,
            (v_item->>'quantity')::INTEGER,
            v_unit_price,
            v_unit_price * (v_item->>'quantity')::INTEGER
        );
        
        -- Update product stock (deduct pieces)
        UPDATE products 
        SET stock_quantity = stock_quantity - v_quantity_in_pieces,
            last_updated = NOW()
        WHERE id = v_product.id;
        
        -- Create stock movement record
        INSERT INTO stock_movements (
            product_id,
            movement_type,
            quantity,
            notes,
            created_by
        ) VALUES (
            v_product.id,
            'out',
            v_quantity_in_pieces,
            'Sale: ' || v_generated_sale_number || ' (' || v_variant_type || ')',
            auth.uid()
        );
        
        -- Add to total
        v_total_amount := v_total_amount + (v_unit_price * (v_item->>'quantity')::INTEGER);
    END LOOP;
    
    -- Update sale total
    UPDATE sales 
    SET total_amount = v_total_amount 
    WHERE id = v_sale_id;
    
    RETURN json_build_object(
        'success', true,
        'sale_id', v_sale_id,
        'sale_number', v_generated_sale_number,
        'total_amount', v_total_amount
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get product with variant pricing
CREATE OR REPLACE FUNCTION get_product_variants(p_product_id UUID)
RETURNS JSON AS $$
DECLARE
    v_product products%ROWTYPE;
    v_result JSON;
BEGIN
    SELECT * INTO v_product FROM products WHERE id = p_product_id AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN json_build_object('error', 'Product not found');
    END IF;
    
    v_result := json_build_object(
        'piece', json_build_object(
            'price', v_product.selling_price,
            'available', v_product.stock_quantity
        ),
        'box', json_build_object(
            'price', v_product.box_price,
            'pieces_per_unit', v_product.pieces_per_box,
            'available', FLOOR(v_product.stock_quantity / v_product.pieces_per_box)
        ),
        'sheet', json_build_object(
            'price', v_product.sheet_price,
            'pieces_per_unit', v_product.pieces_per_sheet,
            'available', FLOOR(v_product.stock_quantity / v_product.pieces_per_sheet)
        )
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update add_stock function to handle variants
DROP FUNCTION IF EXISTS add_stock(UUID, INTEGER, TEXT);
CREATE OR REPLACE FUNCTION add_stock(
    p_product_id UUID,
    p_quantity INTEGER,
    p_variant TEXT DEFAULT 'piece',
    p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_product products%ROWTYPE;
    v_movement_id UUID;
    v_pieces_to_add INTEGER;
BEGIN
    -- Get product details
    SELECT * INTO v_product FROM products WHERE id = p_product_id AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Product not found');
    END IF;
    
    -- Calculate pieces to add based on variant
    CASE p_variant
        WHEN 'box' THEN
            v_pieces_to_add := p_quantity * v_product.pieces_per_box;
        WHEN 'sheet' THEN
            v_pieces_to_add := p_quantity * v_product.pieces_per_sheet;
        ELSE -- piece
            v_pieces_to_add := p_quantity;
    END CASE;
    
    -- Update product stock (always stored as pieces)
    UPDATE products 
    SET stock_quantity = stock_quantity + v_pieces_to_add,
        last_updated = NOW()
    WHERE id = p_product_id;
    
    -- Create stock movement record
    INSERT INTO stock_movements (
        product_id,
        movement_type,
        quantity,
        notes,
        created_by
    ) VALUES (
        p_product_id,
        'in',
        v_pieces_to_add,
        COALESCE(p_notes, 'Stock added: ' || p_quantity || ' ' || p_variant),
        auth.uid()
    ) RETURNING id INTO v_movement_id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Stock added successfully',
        'pieces_added', v_pieces_to_add,
        'new_quantity', v_product.stock_quantity + v_pieces_to_add
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'PRODUCT VARIANTS SYSTEM COMPLETED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Features Added:';
    RAISE NOTICE '✓ Product variants: piece, box, sheet';
    RAISE NOTICE '✓ Variant pricing support';
    RAISE NOTICE '✓ Stock tracking in pieces';
    RAISE NOTICE '✓ Updated sales processing';
    RAISE NOTICE '✓ Stock movement with variants';
    RAISE NOTICE '';
    RAISE NOTICE 'Database schema updated for variant support!';
    RAISE NOTICE '========================================';
END $$;
