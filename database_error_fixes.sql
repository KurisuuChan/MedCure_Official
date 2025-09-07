-- =====================================================
-- DIRECT FIXES FOR MEDCURE PHARMACY DATABASE ERRORS
-- =====================================================
-- Run these SQL commands in your Supabase SQL Editor to fix all errors

-- FIX 1: Add missing columns to sales and products tables
ALTER TABLE sales ADD COLUMN IF NOT EXISTS sale_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS sale_number TEXT UNIQUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS reorder_level INTEGER DEFAULT 10;

-- FIX 2: Create missing process_sale RPC function
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
BEGIN
    -- Generate sale number
    SELECT 'SALE-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
           LPAD((COUNT(*) + 1)::TEXT, 4, '0')
    INTO v_generated_sale_number
    FROM sales 
    WHERE DATE(created_at) = CURRENT_DATE;
    
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
    
    -- Process each item
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        -- Get product details
        SELECT * INTO v_product 
        FROM products 
        WHERE id = (v_item->>'product_id')::UUID;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product not found: %', v_item->>'product_id';
        END IF;
        
        -- Check stock availability
        IF v_product.stock_quantity < (v_item->>'quantity')::INTEGER THEN
            RAISE EXCEPTION 'Insufficient stock for product: %', v_product.name;
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
            v_product.selling_price,
            v_product.selling_price * (v_item->>'quantity')::INTEGER
        );
        
        -- Update product stock
        UPDATE products 
        SET stock_quantity = stock_quantity - (v_item->>'quantity')::INTEGER,
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
            (v_item->>'quantity')::INTEGER,
            'Sale: ' || v_generated_sale_number,
            auth.uid()
        );
        
        -- Add to total
        v_total_amount := v_total_amount + (v_product.selling_price * (v_item->>'quantity')::INTEGER);
    END LOOP;
    
    -- Update sale total
    UPDATE sales 
    SET total_amount = v_total_amount 
    WHERE id = v_sale_id;
    
    RETURN json_build_object(
        'success', true,
        'sale_id', v_sale_id,
        'sale_number', v_sale_number,
        'total_amount', v_total_amount
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FIX 3: Create missing get_dashboard_analytics RPC function
DROP FUNCTION IF EXISTS get_dashboard_analytics();
CREATE OR REPLACE FUNCTION get_dashboard_analytics()
RETURNS JSON AS $$
DECLARE
    v_result JSON;
    v_today_sales DECIMAL;
    v_total_products INTEGER;
    v_low_stock_count INTEGER;
    v_total_revenue DECIMAL;
BEGIN
    -- Today's sales
    SELECT COALESCE(SUM(total_amount), 0) INTO v_today_sales
    FROM sales 
    WHERE DATE(created_at) = CURRENT_DATE;
    
    -- Total products
    SELECT COUNT(*) INTO v_total_products FROM products;
    
    -- Low stock count
    SELECT COUNT(*) INTO v_low_stock_count
    FROM products 
    WHERE stock_quantity <= reorder_level;
    
    -- Total revenue (all time)
    SELECT COALESCE(SUM(total_amount), 0) INTO v_total_revenue
    FROM sales;
    
    v_result := json_build_object(
        'today_sales', v_today_sales,
        'total_products', v_total_products,
        'low_stock_count', v_low_stock_count,
        'total_revenue', v_total_revenue,
        'recent_sales', (
            SELECT COALESCE(json_agg(
                json_build_object(
                    'id', sales.id,
                    'sale_number', sales.sale_number,
                    'customer_name', sales.customer_name,
                    'total_amount', sales.total_amount,
                    'created_at', sales.created_at
                )
            ), '[]'::json)
            FROM (
                SELECT id, sale_number, customer_name, total_amount, created_at 
                FROM sales 
                ORDER BY created_at DESC 
                LIMIT 5
            ) sales
        )
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FIX 4: Create user profile trigger for automatic role assignment
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id, email, role, first_name, last_name)
    VALUES (
        NEW.id,
        NEW.email,
        CASE 
            WHEN NEW.email LIKE '%admin%' THEN 'admin'
            WHEN NEW.email LIKE '%pharmacist%' THEN 'pharmacist'
            ELSE 'cashier'
        END,
        COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'last_name', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- FIX 5: Helper function for user roles
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
BEGIN
    RETURN (SELECT role FROM user_profiles WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FIX 6: Update RLS policies for proper access control
-- Drop existing policies
DROP POLICY IF EXISTS "Allow all operations on products" ON products;
DROP POLICY IF EXISTS "Allow all operations on categories" ON categories;

-- Create proper role-based policies
CREATE POLICY "Allow admin and pharmacist to manage products" ON products 
    FOR ALL USING (get_user_role(auth.uid()) IN ('admin', 'pharmacist'));
CREATE POLICY "Allow cashier to view products" ON products 
    FOR SELECT USING (get_user_role(auth.uid()) = 'cashier');

CREATE POLICY "Allow admin and pharmacist to manage categories" ON categories 
    FOR ALL USING (get_user_role(auth.uid()) IN ('admin', 'pharmacist'));
CREATE POLICY "Allow cashier to view categories" ON categories 
    FOR SELECT USING (get_user_role(auth.uid()) = 'cashier');

-- Success message
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DATABASE ERROR FIXES APPLIED SUCCESSFULLY!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Fixed Issues:';
    RAISE NOTICE '✓ Added sale_date and sale_number columns to sales table';
    RAISE NOTICE '✓ Created process_sale() RPC function';
    RAISE NOTICE '✓ Created get_dashboard_analytics() function';
    RAISE NOTICE '✓ Added automatic user profile creation';
    RAISE NOTICE '✓ Updated RLS policies for proper access';
    RAISE NOTICE '';
    RAISE NOTICE 'Your application should now work without errors!';
    RAISE NOTICE '========================================';
END $$;
