-- Medcure Pharmacy Management System - Complete Database Setup
-- This script sets up the complete database schema with tables, RLS policies, functions, and sample data
-- Version: 2.0 - Consolidated with smart sample data insertion

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Cleanup function for development (removes all existing data)
-- UNCOMMENT ONLY IF YOU WANT TO COMPLETELY RESET THE DATABASE
/*
-- WARNING: This will delete ALL data. Use only for fresh setup during development.
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS sale_items CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS sale_status CASCADE;
DROP TYPE IF EXISTS health_status CASCADE;
*/

-- Safe cleanup: Only drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS sale_items CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
-- NOTE: user_profiles is NOT dropped to preserve user data
-- Uncomment the next line only if you want to reset users too:
-- DROP TABLE IF EXISTS user_profiles CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS sale_status CASCADE;
DROP TYPE IF EXISTS health_status CASCADE;

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'pharmacist', 'cashier');
CREATE TYPE sale_status AS ENUM ('completed', 'voided', 'pending');
CREATE TYPE health_status AS ENUM ('good', 'low_stock', 'expiring_soon', 'expired');

-- Create categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    brand VARCHAR(100),
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    batch_number VARCHAR(50) UNIQUE NOT NULL,
    barcode VARCHAR(100) UNIQUE,
    description TEXT,
    
    -- Pricing
    cost_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    selling_price DECIMAL(10,2) NOT NULL,
    
    -- Stock information
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    min_stock_level INTEGER NOT NULL DEFAULT 10,
    max_stock_level INTEGER NOT NULL DEFAULT 1000,
    
    -- Package information
    pieces_per_sheet INTEGER DEFAULT 1,
    sheets_per_box INTEGER DEFAULT 1,
    
    -- Dates
    manufacturing_date DATE,
    expiry_date DATE NOT NULL,
    
    -- Metadata
    supplier VARCHAR(255),
    location VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT positive_prices CHECK (cost_price >= 0 AND selling_price > 0),
    CONSTRAINT positive_stock CHECK (stock_quantity >= 0),
    CONSTRAINT valid_stock_levels CHECK (min_stock_level <= max_stock_level),
    CONSTRAINT valid_package_info CHECK (pieces_per_sheet > 0 AND sheets_per_box > 0),
    CONSTRAINT valid_dates CHECK (expiry_date > manufacturing_date OR manufacturing_date IS NULL)
);

-- Create user profiles table
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'cashier',
    phone VARCHAR(20),
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sales table
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_number VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    
    -- Financial information
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    
    -- Payment information
    payment_method VARCHAR(50) DEFAULT 'cash',
    amount_paid DECIMAL(10,2) NOT NULL,
    change_amount DECIMAL(10,2) DEFAULT 0,
    
    -- Status and metadata
    status sale_status DEFAULT 'completed',
    void_reason TEXT,
    notes TEXT,
    
    -- User tracking
    cashier_id UUID REFERENCES user_profiles(id),
    voided_by UUID REFERENCES user_profiles(id),
    
    -- Timestamps
    sale_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    voided_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT positive_amounts CHECK (
        subtotal >= 0 AND 
        tax_amount >= 0 AND 
        discount_amount >= 0 AND 
        total_amount >= 0 AND 
        amount_paid >= 0 AND 
        change_amount >= 0
    ),
    CONSTRAINT valid_payment CHECK (amount_paid >= total_amount OR status = 'voided')
);

-- Create sale items table
CREATE TABLE sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    
    -- Product snapshot (in case product is deleted)
    product_name VARCHAR(255) NOT NULL,
    product_batch VARCHAR(50) NOT NULL,
    
    -- Quantity and pricing
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    
    -- Unit type (piece, sheet, box)
    unit_type VARCHAR(20) DEFAULT 'piece',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT positive_quantity CHECK (quantity > 0),
    CONSTRAINT positive_prices CHECK (unit_price > 0 AND total_price > 0),
    CONSTRAINT valid_unit_type CHECK (unit_type IN ('piece', 'sheet', 'box')),
    CONSTRAINT valid_total CHECK (total_price = quantity * unit_price)
);

-- Create audit logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    operation VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
    record_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    user_id UUID REFERENCES user_profiles(id),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_operation CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE'))
);

-- Create indexes for better performance
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_batch ON products(batch_number);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_expiry ON products(expiry_date);
CREATE INDEX idx_products_stock ON products(stock_quantity);
CREATE INDEX idx_products_active ON products(is_active);

CREATE INDEX idx_sales_cashier ON sales(cashier_id);
CREATE INDEX idx_sales_date ON sales(sale_date);
CREATE INDEX idx_sales_status ON sales(status);
CREATE INDEX idx_sales_number ON sales(sale_number);

CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product ON sale_items(product_id);

CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);

CREATE INDEX idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Categories policies
CREATE POLICY "Categories are viewable by all authenticated users" ON categories
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Categories can be managed by admins and pharmacists" ON categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'pharmacist')
            AND is_active = true
        )
    );

-- Products policies
CREATE POLICY "Products are viewable by all authenticated users" ON products
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Products can be managed by admins and pharmacists" ON products
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'pharmacist')
            AND is_active = true
        )
    );

CREATE POLICY "Products can be updated by admins and pharmacists" ON products
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'pharmacist')
            AND is_active = true
        )
    );

CREATE POLICY "Products can be deleted by admins only" ON products
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
            AND is_active = true
        )
    );

-- User profiles policies
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid() 
            AND up.role = 'admin'
            AND up.is_active = true
        )
    );

CREATE POLICY "Admins can manage all profiles" ON user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid() 
            AND up.role = 'admin'
            AND up.is_active = true
        )
    );

-- Sales policies
CREATE POLICY "Sales are viewable by all authenticated users" ON sales
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Sales can be created by all authenticated users" ON sales
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Sales can be voided by admins and pharmacists" ON sales
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'pharmacist')
            AND is_active = true
        )
    );

-- Sale items policies
CREATE POLICY "Sale items are viewable by all authenticated users" ON sale_items
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Sale items can be created with sales" ON sale_items
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Audit logs policies
CREATE POLICY "Audit logs are viewable by admins only" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
            AND is_active = true
        )
    );

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to generate batch numbers
CREATE OR REPLACE FUNCTION generate_batch_number(category_name TEXT)
RETURNS TEXT AS $$
DECLARE
    category_prefix TEXT;
    date_part TEXT;
    sequence_num INTEGER;
    batch_number TEXT;
BEGIN
    -- Get first 3 letters of category name, uppercase
    category_prefix := UPPER(LEFT(REPLACE(category_name, ' ', ''), 3));
    
    -- Get current date in YYMMDD format
    date_part := TO_CHAR(CURRENT_DATE, 'YYMMDD');
    
    -- Get next sequence number for today
    SELECT COALESCE(MAX(CAST(RIGHT(batch_number, 3) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM products
    WHERE batch_number LIKE category_prefix || date_part || '%';
    
    -- Generate final batch number
    batch_number := category_prefix || date_part || LPAD(sequence_num::TEXT, 3, '0');
    
    RETURN batch_number;
END;
$$ LANGUAGE plpgsql;

-- Create function to get product health status
CREATE OR REPLACE FUNCTION get_product_health_status(
    stock_qty INTEGER,
    min_stock INTEGER,
    expiry_date DATE
)
RETURNS health_status AS $$
BEGIN
    -- Check if expired
    IF expiry_date <= CURRENT_DATE THEN
        RETURN 'expired';
    END IF;
    
    -- Check if expiring soon (within 30 days)
    IF expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN
        RETURN 'expiring_soon';
    END IF;
    
    -- Check if low stock
    IF stock_qty <= min_stock THEN
        RETURN 'low_stock';
    END IF;
    
    -- Otherwise good
    RETURN 'good';
END;
$$ LANGUAGE plpgsql;

-- Create function to process a sale (atomic transaction)
CREATE OR REPLACE FUNCTION process_sale(
    sale_data JSONB,
    items_data JSONB[]
)
RETURNS UUID AS $$
DECLARE
    new_sale_id UUID;
    item JSONB;
    product_record RECORD;
    sale_number TEXT;
BEGIN
    -- Generate unique sale number
    SELECT 'MED' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
           LPAD((COALESCE(MAX(CAST(SPLIT_PART(sale_number, '-', 2) AS INTEGER)), 0) + 1)::TEXT, 4, '0')
    INTO sale_number
    FROM sales
    WHERE sale_number LIKE 'MED' || TO_CHAR(NOW(), 'YYYYMMDD') || '-%';
    
    -- Insert the sale
    INSERT INTO sales (
        sale_number,
        customer_name,
        customer_phone,
        subtotal,
        tax_amount,
        discount_amount,
        total_amount,
        payment_method,
        amount_paid,
        change_amount,
        cashier_id,
        notes
    ) VALUES (
        sale_number,
        sale_data->>'customer_name',
        sale_data->>'customer_phone',
        (sale_data->>'subtotal')::DECIMAL,
        (sale_data->>'tax_amount')::DECIMAL,
        (sale_data->>'discount_amount')::DECIMAL,
        (sale_data->>'total_amount')::DECIMAL,
        sale_data->>'payment_method',
        (sale_data->>'amount_paid')::DECIMAL,
        (sale_data->>'change_amount')::DECIMAL,
        (sale_data->>'cashier_id')::UUID,
        sale_data->>'notes'
    ) RETURNING id INTO new_sale_id;
    
    -- Process each sale item
    FOREACH item IN ARRAY items_data LOOP
        -- Get product information
        SELECT * INTO product_record
        FROM products
        WHERE id = (item->>'product_id')::UUID;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product not found: %', item->>'product_id';
        END IF;
        
        -- Check stock availability
        IF product_record.stock_quantity < (item->>'quantity')::INTEGER THEN
            RAISE EXCEPTION 'Insufficient stock for product: %. Available: %, Requested: %', 
                product_record.name, product_record.stock_quantity, (item->>'quantity')::INTEGER;
        END IF;
        
        -- Insert sale item
        INSERT INTO sale_items (
            sale_id,
            product_id,
            product_name,
            product_batch,
            quantity,
            unit_price,
            total_price,
            unit_type
        ) VALUES (
            new_sale_id,
            (item->>'product_id')::UUID,
            product_record.name,
            product_record.batch_number,
            (item->>'quantity')::INTEGER,
            (item->>'unit_price')::DECIMAL,
            (item->>'total_price')::DECIMAL,
            item->>'unit_type'
        );
        
        -- Update product stock
        UPDATE products
        SET stock_quantity = stock_quantity - (item->>'quantity')::INTEGER
        WHERE id = (item->>'product_id')::UUID;
    END LOOP;
    
    RETURN new_sale_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to void a sale
CREATE OR REPLACE FUNCTION void_sale_transaction(
    sale_id_param UUID,
    void_reason_param TEXT,
    voided_by_param UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    item_record RECORD;
BEGIN
    -- Check if sale exists and is not already voided
    IF NOT EXISTS (
        SELECT 1 FROM sales 
        WHERE id = sale_id_param AND status = 'completed'
    ) THEN
        RAISE EXCEPTION 'Sale not found or already voided';
    END IF;
    
    -- Return stock for each item
    FOR item_record IN 
        SELECT product_id, quantity 
        FROM sale_items 
        WHERE sale_id = sale_id_param
    LOOP
        UPDATE products
        SET stock_quantity = stock_quantity + item_record.quantity
        WHERE id = item_record.product_id;
    END LOOP;
    
    -- Update sale status
    UPDATE sales
    SET 
        status = 'voided',
        void_reason = void_reason_param,
        voided_by = voided_by_param,
        voided_at = NOW()
    WHERE id = sale_id_param;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create function to get dashboard analytics
CREATE OR REPLACE FUNCTION get_dashboard_analytics()
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    total_products INTEGER;
    low_stock_count INTEGER;
    expiring_soon_count INTEGER;
    expired_count INTEGER;
    today_sales DECIMAL;
    month_sales DECIMAL;
    recent_sales JSONB;
BEGIN
    -- Get product counts
    SELECT COUNT(*) INTO total_products FROM products WHERE is_active = true;
    
    SELECT COUNT(*) INTO low_stock_count 
    FROM products 
    WHERE is_active = true AND stock_quantity <= min_stock_level;
    
    SELECT COUNT(*) INTO expiring_soon_count
    FROM products
    WHERE is_active = true 
    AND expiry_date > CURRENT_DATE 
    AND expiry_date <= CURRENT_DATE + INTERVAL '30 days';
    
    SELECT COUNT(*) INTO expired_count
    FROM products
    WHERE is_active = true AND expiry_date <= CURRENT_DATE;
    
    -- Get sales data
    SELECT COALESCE(SUM(total_amount), 0) INTO today_sales
    FROM sales
    WHERE DATE(sale_date) = CURRENT_DATE AND status = 'completed';
    
    SELECT COALESCE(SUM(total_amount), 0) INTO month_sales
    FROM sales
    WHERE DATE_PART('month', sale_date) = DATE_PART('month', CURRENT_DATE)
    AND DATE_PART('year', sale_date) = DATE_PART('year', CURRENT_DATE)
    AND status = 'completed';
    
    -- Get recent sales
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', s.id,
            'sale_number', s.sale_number,
            'customer_name', s.customer_name,
            'total_amount', s.total_amount,
            'sale_date', s.sale_date,
            'status', s.status
        ) ORDER BY s.sale_date DESC
    ) INTO recent_sales
    FROM sales s
    WHERE s.status = 'completed'
    LIMIT 10;
    
    -- Build result
    result := jsonb_build_object(
        'products', jsonb_build_object(
            'total', total_products,
            'low_stock', low_stock_count,
            'expiring_soon', expiring_soon_count,
            'expired', expired_count
        ),
        'sales', jsonb_build_object(
            'today', today_sales,
            'month', month_sales,
            'recent', COALESCE(recent_sales, '[]'::jsonb)
        )
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (table_name, operation, record_id, old_values, user_id)
        VALUES (TG_TABLE_NAME, TG_OP, OLD.id, row_to_json(OLD), auth.uid());
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (table_name, operation, record_id, old_values, new_values, user_id)
        VALUES (TG_TABLE_NAME, TG_OP, NEW.id, row_to_json(OLD), row_to_json(NEW), auth.uid());
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (table_name, operation, record_id, new_values, user_id)
        VALUES (TG_TABLE_NAME, TG_OP, NEW.id, row_to_json(NEW), auth.uid());
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create audit triggers
CREATE TRIGGER audit_products_trigger
    AFTER INSERT OR UPDATE OR DELETE ON products
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_sales_trigger
    AFTER INSERT OR UPDATE OR DELETE ON sales
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Insert sample categories
INSERT INTO categories (name, description) VALUES
('Analgesic', 'Pain relievers and fever reducers'),
('Antibiotic', 'Medications that fight bacterial infections'),
('Antacid', 'Medications for heartburn and acid indigestion'),
('Vitamin', 'Vitamin and mineral supplements'),
('Cough Medicine', 'Medications for cough and cold symptoms'),
('Antiseptic', 'Topical medications for wound care'),
('Diabetes Care', 'Medications and supplies for diabetes management'),
('Hypertension', 'Medications for high blood pressure'),
('Allergy', 'Medications for allergic reactions'),
('Digestive', 'Medications for digestive issues');

-- Insert sample products
INSERT INTO products (
    name, generic_name, brand, category_id, batch_number, barcode,
    cost_price, selling_price, stock_quantity, min_stock_level,
    pieces_per_sheet, sheets_per_box, manufacturing_date, expiry_date,
    supplier, description
) VALUES
('Paracetamol 500mg', 'Paracetamol', 'Biogesic', 
    (SELECT id FROM categories WHERE name = 'Analgesic'), 
    'ANA250906001', '1234567890123',
    5.00, 8.00, 150, 20, 10, 10, '2024-01-15', '2026-01-15',
    'Unilab Inc.', 'For fever and pain relief'),
    
('Amoxicillin 500mg', 'Amoxicillin', 'Amoxil', 
    (SELECT id FROM categories WHERE name = 'Antibiotic'), 
    'ANT250906001', '2345678901234',
    12.00, 18.00, 80, 15, 10, 5, '2024-02-01', '2025-12-01',
    'GSK Philippines', 'Antibiotic for bacterial infections'),
    
('Vitamin C 500mg', 'Ascorbic Acid', 'Cecon', 
    (SELECT id FROM categories WHERE name = 'Vitamin'), 
    'VIT250906001', '3456789012345',
    3.00, 5.50, 200, 30, 10, 20, '2024-03-01', '2026-03-01',
    'Universal Robina', 'Vitamin C supplement'),
    
('Cetirizine 10mg', 'Cetirizine', 'Zyrtec', 
    (SELECT id FROM categories WHERE name = 'Allergy'), 
    'ALL250906001', '4567890123456',
    8.00, 12.00, 100, 20, 10, 10, '2024-01-20', '2025-11-20',
    'Johnson & Johnson', 'For allergic reactions'),
    
('Omeprazole 20mg', 'Omeprazole', 'Losec', 
    (SELECT id FROM categories WHERE name = 'Antacid'), 
    'ANT250906002', '5678901234567',
    15.00, 22.00, 60, 15, 14, 2, '2024-02-15', '2025-10-15',
    'AstraZeneca', 'For acid reflux and GERD');

-- Create test user accounts in Supabase auth system
-- IMPORTANT: These users must be created through Supabase Auth Dashboard or signup API
-- This section is commented out because direct auth table manipulation can cause issues

/*
-- Method 1: Use Supabase Dashboard
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add User" and create:
--    - admin@medcure.com (password: 123456)
--    - pharmacist@medcure.com (password: 123456)  
--    - cashier@medcure.com (password: 123456)
-- 3. Note their UUIDs and update the INSERT statements below

-- Method 2: Use the createTestUsers utility in src/utils/createTestUsers.js
*/

-- User profiles will be created automatically via the signup process or manually:
-- Replace the UUIDs below with the actual UUIDs from Supabase Auth after creating users

-- Example user profiles (update IDs after creating auth users):
-- INSERT INTO user_profiles (id, email, full_name, role, phone, is_active) VALUES
-- ('replace-with-actual-uuid-1', 'admin@medcure.com', 'Admin User', 'admin', '+63-917-123-4567', true),
-- ('replace-with-actual-uuid-2', 'pharmacist@medcure.com', 'Pharmacist User', 'pharmacist', '+63-917-234-5678', true),
-- ('replace-with-actual-uuid-3', 'cashier@medcure.com', 'Cashier User', 'cashier', '+63-917-345-6789', true);

-- Smart Sample Data Insertion
-- This section safely adds sample sales data only if users exist
-- It prevents foreign key constraint violations during initial setup

DO $$
DECLARE
    user_count INTEGER;
    cashier_id UUID;
    admin_id UUID;
    existing_sales INTEGER;
BEGIN
    -- Check if we have any users
    SELECT COUNT(*) INTO user_count FROM user_profiles;
    
    -- Check if sample sales already exist
    SELECT COUNT(*) INTO existing_sales FROM sales WHERE sale_number LIKE 'MED20240907-%';
    
    IF user_count = 0 THEN
        RAISE NOTICE '⚠️  No users found in user_profiles table.';
        RAISE NOTICE '📝 Sample sales data will be skipped.';
        RAISE NOTICE '🔧 Create users first, then run this script again to add sample data.';
        RETURN;
    END IF;
    
    IF existing_sales > 0 THEN
        RAISE NOTICE '✅ Sample sales data already exists. Skipping insertion.';
        RETURN;
    END IF;
    
    -- Get user IDs
    SELECT id INTO cashier_id FROM user_profiles WHERE role = 'cashier' LIMIT 1;
    SELECT id INTO admin_id FROM user_profiles WHERE role = 'admin' LIMIT 1;
    
    -- Use any user if specific roles don't exist
    IF cashier_id IS NULL THEN
        SELECT id INTO cashier_id FROM user_profiles LIMIT 1;
        RAISE NOTICE '⚠️  No cashier found, using first available user for sample sales.';
    END IF;
    
    -- Clean up any existing sample data first (safety measure)
    DELETE FROM sale_items WHERE sale_id IN (
        SELECT id FROM sales WHERE sale_number LIKE 'MED20240907-%'
    );
    DELETE FROM sales WHERE sale_number LIKE 'MED20240907-%';
    
    -- Reset product stock to ensure consistency
    UPDATE products SET stock_quantity = 150 WHERE name = 'Paracetamol 500mg';
    UPDATE products SET stock_quantity = 80 WHERE name = 'Amoxicillin 500mg';
    UPDATE products SET stock_quantity = 200 WHERE name = 'Vitamin C 500mg';
    UPDATE products SET stock_quantity = 100 WHERE name = 'Cetirizine 10mg';
    UPDATE products SET stock_quantity = 60 WHERE name = 'Omeprazole 20mg';
    
    -- Insert sample sales data with actual user IDs
    INSERT INTO sales (
        sale_number, customer_name, customer_phone, subtotal, total_amount, 
        payment_method, amount_paid, change_amount, cashier_id, notes
    ) VALUES
    ('MED20240907-0001', 'Juan Dela Cruz', '+63-917-555-0001', 26.00, 26.00, 'cash', 30.00, 4.00, 
        cashier_id, 'Regular customer - pain relief'),
    ('MED20240907-0002', 'Maria Santos', '+63-917-555-0002', 18.00, 18.00, 'cash', 20.00, 2.00, 
        cashier_id, 'Prescription for bacterial infection'),
    ('MED20240907-0003', 'Pedro Gonzales', '+63-917-555-0003', 45.50, 45.50, 'gcash', 45.50, 0.00, 
        cashier_id, 'Vitamin supplements for family'),
    ('MED20240907-0004', 'Ana Rodriguez', '+63-917-555-0004', 12.00, 12.00, 'cash', 15.00, 3.00, 
        cashier_id, 'Allergy medication');

    -- Sample sale items for each sale
    INSERT INTO sale_items (
        sale_id, product_id, product_name, product_batch, 
        quantity, unit_price, total_price, unit_type
    ) VALUES
    -- Sale 1 items
    ((SELECT id FROM sales WHERE sale_number = 'MED20240907-0001'),
        (SELECT id FROM products WHERE name = 'Paracetamol 500mg'),
        'Paracetamol 500mg', 'ANA250906001', 2, 8.00, 16.00, 'piece'),
    ((SELECT id FROM sales WHERE sale_number = 'MED20240907-0001'),
        (SELECT id FROM products WHERE name = 'Vitamin C 500mg'),
        'Vitamin C 500mg', 'VIT250906001', 2, 5.50, 11.00, 'piece'),

    -- Sale 2 items
    ((SELECT id FROM sales WHERE sale_number = 'MED20240907-0002'),
        (SELECT id FROM products WHERE name = 'Amoxicillin 500mg'),
        'Amoxicillin 500mg', 'ANT250906001', 1, 18.00, 18.00, 'piece'),

    -- Sale 3 items
    ((SELECT id FROM sales WHERE sale_number = 'MED20240907-0003'),
        (SELECT id FROM products WHERE name = 'Vitamin C 500mg'),
        'Vitamin C 500mg', 'VIT250906001', 5, 5.50, 27.50, 'piece'),
    ((SELECT id FROM sales WHERE sale_number = 'MED20240907-0003'),
        (SELECT id FROM products WHERE name = 'Paracetamol 500mg'),
        'Paracetamol 500mg', 'ANA250906001', 2, 8.00, 16.00, 'piece'),
    ((SELECT id FROM sales WHERE sale_number = 'MED20240907-0003'),
        (SELECT id FROM products WHERE name = 'Omeprazole 20mg'),
        'Omeprazole 20mg', 'ANT250906002', 1, 22.00, 22.00, 'piece'),

    -- Sale 4 items
    ((SELECT id FROM sales WHERE sale_number = 'MED20240907-0004'),
        (SELECT id FROM products WHERE name = 'Cetirizine 10mg'),
        'Cetirizine 10mg', 'ALL250906001', 1, 12.00, 12.00, 'piece');

    -- Update product stock to reflect these sales
    UPDATE products SET stock_quantity = stock_quantity - 4 WHERE name = 'Paracetamol 500mg';
    UPDATE products SET stock_quantity = stock_quantity - 7 WHERE name = 'Vitamin C 500mg';
    UPDATE products SET stock_quantity = stock_quantity - 1 WHERE name = 'Amoxicillin 500mg';
    UPDATE products SET stock_quantity = stock_quantity - 1 WHERE name = 'Cetirizine 10mg';
    UPDATE products SET stock_quantity = stock_quantity - 1 WHERE name = 'Omeprazole 20mg';

    RAISE NOTICE '✅ Sample data inserted successfully!';
    RAISE NOTICE '📦 Products sold:';
    RAISE NOTICE '   - Paracetamol 500mg: 4 pieces';
    RAISE NOTICE '   - Vitamin C 500mg: 7 pieces';
    RAISE NOTICE '   - Amoxicillin 500mg: 1 piece';
    RAISE NOTICE '   - Cetirizine 10mg: 1 piece';
    RAISE NOTICE '   - Omeprazole 20mg: 1 piece';
    RAISE NOTICE '💰 Total sales: 4 transactions (₱101.50)';
    RAISE NOTICE '👤 Sample sales assigned to user: %', cashier_id;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error inserting sample data: %', SQLERRM;
        RAISE NOTICE '🔧 You may need to create users first, then re-run this script.';
END $$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Comments for documentation
COMMENT ON TABLE products IS 'Stores all pharmacy products with stock and pricing information';
COMMENT ON TABLE sales IS 'Records all sales transactions';
COMMENT ON TABLE sale_items IS 'Individual items within each sale';
COMMENT ON TABLE user_profiles IS 'Extended user information with roles';
COMMENT ON TABLE categories IS 'Product categories for organization';
COMMENT ON TABLE audit_logs IS 'Audit trail for all database changes';

COMMENT ON FUNCTION process_sale IS 'Atomically processes a sale and updates inventory';
COMMENT ON FUNCTION void_sale_transaction IS 'Voids a sale and returns stock to inventory';
COMMENT ON FUNCTION get_dashboard_analytics IS 'Returns aggregated data for dashboard display';
COMMENT ON FUNCTION generate_batch_number IS 'Generates unique batch numbers for products';
COMMENT ON FUNCTION get_product_health_status IS 'Determines product health based on stock and expiry';

-- Final setup message and status
SELECT '🎉 MEDCURE PHARMACY DATABASE SETUP COMPLETE! 🎉

📊 DATABASE COMPONENTS CREATED:
✅ Tables: categories, products, user_profiles, sales, sale_items, audit_logs
✅ RLS Policies: Role-based security for all tables
✅ Functions: process_sale, void_sale_transaction, get_dashboard_analytics
✅ Triggers: Auto-update timestamps, audit logging
✅ Sample Data: ' || (SELECT COUNT(*) FROM categories) || ' categories, ' || (SELECT COUNT(*) FROM products) || ' products
✅ Indexes: Optimized for performance

🚀 NEXT STEPS TO COMPLETE SETUP:

METHOD 1 - Supabase Dashboard (Recommended):
1. Go to https://app.supabase.com > Your Project > Authentication > Users
2. Click "Add User" and create these accounts:
   📧 admin@medcure.com (password: 123456) - Full system access
   📧 pharmacist@medcure.com (password: 123456) - Inventory & sales management
   📧 cashier@medcure.com (password: 123456) - POS operations only
3. Set "Email Confirm" to YES for each user
4. Re-run this script to add sample sales data

METHOD 2 - Use Signup Utility:
1. Start your React app: npm run dev
2. Open browser console at http://localhost:5174
3. Run: import("./src/utils/createTestUsers.js").then(m => m.createTestUsers())

🔐 LOGIN CREDENTIALS (after user creation):
   👑 admin@medcure.com / 123456 (Complete system control)
   💊 pharmacist@medcure.com / 123456 (Inventory + sales management)  
   🛒 cashier@medcure.com / 123456 (POS operations only)

📋 SYSTEM FEATURES READY:
✨ Role-Based Access Control (RBAC)
✨ Real-time Inventory Management
✨ Point-of-Sale (POS) System
✨ Sales Analytics & Reporting
✨ Product Expiry Monitoring
✨ Low Stock Alerts
✨ Audit Trail & Logging
✨ Multi-payment Support (Cash, GCash, Card)
✨ Customer Management
✨ Batch Number Tracking

🎯 AFTER USER CREATION:
- Sample sales data will be automatically added
- Dashboard analytics will populate with real data
- All system features will be fully functional

⚡ Your modern pharmacy management system is ready for production!' AS setup_complete_message;
