-- =====================================================
-- MEDCURE PHARMACY - COMPLETE SYSTEM SETUP
-- =====================================================
-- This script will create a fully functional pharmacy management system
-- Run this in your Supabase SQL Editor to complete the development

-- =====================================================
-- 1. ADD MISSING COLUMNS TO EXISTING TABLES
-- =====================================================

-- Add missing columns to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT UNIQUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS reorder_level INTEGER DEFAULT 10;
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS expiry_date DATE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS batch_number TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS location TEXT DEFAULT 'Main Store';
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add missing columns to sales table
ALTER TABLE sales ADD COLUMN IF NOT EXISTS sale_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS sale_number TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed';

-- Add missing columns to user_profiles table
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- =====================================================
-- 2. CREATE INDEXES FOR BETTER PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock_quantity);
CREATE INDEX IF NOT EXISTS idx_products_reorder ON products(reorder_level);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_number ON sales(sale_number);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(created_at);

-- =====================================================
-- 3. FIXED RPC FUNCTIONS (NO AMBIGUOUS REFERENCES)
-- =====================================================

-- Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS process_sale(JSONB, TEXT, TEXT);
DROP FUNCTION IF EXISTS get_dashboard_analytics();
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS get_user_role(UUID);

-- Fixed process_sale function
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
        'sale_number', v_generated_sale_number,
        'total_amount', v_total_amount
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fixed dashboard analytics function
CREATE OR REPLACE FUNCTION get_dashboard_analytics()
RETURNS JSON AS $$
DECLARE
    v_result JSON;
    v_today_sales DECIMAL;
    v_total_products INTEGER;
    v_low_stock_count INTEGER;
    v_total_revenue DECIMAL;
    v_recent_sales JSON;
BEGIN
    -- Today's sales
    SELECT COALESCE(SUM(total_amount), 0) INTO v_today_sales
    FROM sales 
    WHERE DATE(created_at) = CURRENT_DATE;
    
    -- Total products
    SELECT COUNT(*) INTO v_total_products FROM products WHERE is_active = true;
    
    -- Low stock count (products at or below reorder level)
    SELECT COUNT(*) INTO v_low_stock_count
    FROM products 
    WHERE stock_quantity <= reorder_level AND is_active = true;
    
    -- Total revenue (all time)
    SELECT COALESCE(SUM(total_amount), 0) INTO v_total_revenue FROM sales;
    
    -- Recent sales (last 5)
    SELECT COALESCE(json_agg(
        json_build_object(
            'id', recent.id,
            'sale_number', recent.sale_number,
            'customer_name', recent.customer_name,
            'total_amount', recent.total_amount,
            'created_at', recent.created_at
        )
    ), '[]'::json) INTO v_recent_sales
    FROM (
        SELECT id, sale_number, customer_name, total_amount, created_at 
        FROM sales 
        ORDER BY created_at DESC 
        LIMIT 5
    ) recent;
    
    v_result := json_build_object(
        'today_sales', v_today_sales,
        'total_products', v_total_products,
        'low_stock_count', v_low_stock_count,
        'total_revenue', v_total_revenue,
        'recent_sales', v_recent_sales
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- User management functions
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id, email, role, first_name, last_name, is_active)
    VALUES (
        NEW.id,
        NEW.email,
        CASE 
            WHEN NEW.email LIKE '%admin%' THEN 'admin'
            WHEN NEW.email LIKE '%pharmacist%' THEN 'pharmacist'
            ELSE 'cashier'
        END,
        COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        true
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function for user roles
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
BEGIN
    RETURN (SELECT role FROM user_profiles WHERE id = user_id AND is_active = true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- 4. ADDITIONAL UTILITY FUNCTIONS
-- =====================================================

-- Function to add stock
CREATE OR REPLACE FUNCTION add_stock(
    p_product_id UUID,
    p_quantity INTEGER,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_product products%ROWTYPE;
    v_movement_id UUID;
BEGIN
    -- Get product details
    SELECT * INTO v_product FROM products WHERE id = p_product_id AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Product not found');
    END IF;
    
    -- Update product stock
    UPDATE products 
    SET stock_quantity = stock_quantity + p_quantity,
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
        p_quantity,
        COALESCE(p_notes, 'Stock added'),
        auth.uid()
    ) RETURNING id INTO v_movement_id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Stock added successfully',
        'new_quantity', v_product.stock_quantity + p_quantity
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get low stock products
CREATE OR REPLACE FUNCTION get_low_stock_products()
RETURNS TABLE (
    id UUID,
    name TEXT,
    sku TEXT,
    stock_quantity INTEGER,
    reorder_level INTEGER,
    selling_price DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.sku,
        p.stock_quantity,
        p.reorder_level,
        p.selling_price
    FROM products p
    WHERE p.stock_quantity <= p.reorder_level 
    AND p.is_active = true
    ORDER BY p.stock_quantity ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. UPDATE RLS POLICIES
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Allow all operations on products" ON products;
DROP POLICY IF EXISTS "Allow all operations on categories" ON categories;
DROP POLICY IF EXISTS "Allow all operations on sales" ON sales;
DROP POLICY IF EXISTS "Allow all operations on sale_items" ON sale_items;

-- Create proper role-based policies
CREATE POLICY "Admin and pharmacist can manage products" ON products 
    FOR ALL USING (get_user_role(auth.uid()) IN ('admin', 'pharmacist'));
CREATE POLICY "Cashier can view products" ON products 
    FOR SELECT USING (get_user_role(auth.uid()) = 'cashier');

CREATE POLICY "Admin and pharmacist can manage categories" ON categories 
    FOR ALL USING (get_user_role(auth.uid()) IN ('admin', 'pharmacist'));
CREATE POLICY "Cashier can view categories" ON categories 
    FOR SELECT USING (get_user_role(auth.uid()) = 'cashier');

-- Sales policies - all users can manage sales for POS functionality
CREATE POLICY "All users can manage sales" ON sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "All users can manage sale_items" ON sale_items FOR ALL USING (true) WITH CHECK (true);

-- Stock movements - admin and pharmacist can manage, cashier can view
CREATE POLICY "Admin and pharmacist can manage stock_movements" ON stock_movements 
    FOR ALL USING (get_user_role(auth.uid()) IN ('admin', 'pharmacist'));
CREATE POLICY "Cashier can view stock_movements" ON stock_movements 
    FOR SELECT USING (get_user_role(auth.uid()) = 'cashier');

-- =====================================================
-- 6. INSERT SAMPLE DATA FOR TESTING
-- =====================================================

-- Insert sample categories if they don't exist
INSERT INTO categories (name, description) VALUES
('Pain Relief', 'Medications for pain management'),
('Antibiotics', 'Antimicrobial medications'),
('Vitamins', 'Essential vitamins and supplements'),
('Cold & Flu', 'Medications for cold and flu symptoms'),
('First Aid', 'Emergency and first aid supplies')
ON CONFLICT (name) DO NOTHING;

-- Insert sample products with all required fields
INSERT INTO products (
    name, sku, description, selling_price, cost_price, stock_quantity, 
    reorder_level, category_id, supplier, location, is_active
) 
SELECT 
    'Paracetamol 500mg', 'PARA-500', 'Pain relief medication', 25.00, 15.00, 100, 
    20, c.id, 'PharmaCorp', 'Main Store', true
FROM categories c WHERE c.name = 'Pain Relief'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO products (
    name, sku, description, selling_price, cost_price, stock_quantity, 
    reorder_level, category_id, supplier, location, is_active
) 
SELECT 
    'Amoxicillin 250mg', 'AMOX-250', 'Antibiotic medication', 45.00, 30.00, 75, 
    15, c.id, 'MediSupply', 'Main Store', true
FROM categories c WHERE c.name = 'Antibiotics'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO products (
    name, sku, description, selling_price, cost_price, stock_quantity, 
    reorder_level, category_id, supplier, location, is_active
) 
SELECT 
    'Vitamin C 1000mg', 'VITC-1000', 'Immune system support', 35.00, 20.00, 50, 
    10, c.id, 'HealthPlus', 'Main Store', true
FROM categories c WHERE c.name = 'Vitamins'
ON CONFLICT (sku) DO NOTHING;

-- =====================================================
-- 7. COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MEDCURE PHARMACY SYSTEM SETUP COMPLETE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'System Features Enabled:';
    RAISE NOTICE '✓ Complete database schema with all columns';
    RAISE NOTICE '✓ Fixed RPC functions (no ambiguous references)';
    RAISE NOTICE '✓ User authentication and role management';
    RAISE NOTICE '✓ Point of Sale (POS) system';
    RAISE NOTICE '✓ Inventory management with stock tracking';
    RAISE NOTICE '✓ Dashboard analytics';
    RAISE NOTICE '✓ Sample data for testing';
    RAISE NOTICE '';
    RAISE NOTICE 'Available User Roles:';
    RAISE NOTICE '- Admin: Full access (emails with "admin")';
    RAISE NOTICE '- Pharmacist: Inventory management (emails with "pharmacist")';
    RAISE NOTICE '- Cashier: Sales processing (other emails)';
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '1. Sign up with an admin email to get full access';
    RAISE NOTICE '2. Test the POS system';
    RAISE NOTICE '3. Add more products in Inventory Management';
    RAISE NOTICE '4. View analytics on the Dashboard';
    RAISE NOTICE '';
    RAISE NOTICE 'Your pharmacy management system is now ready!';
    RAISE NOTICE '========================================';
END $$;
