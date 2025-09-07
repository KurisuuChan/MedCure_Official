-- =====================================================
-- MEDCURE PHARMACY MANAGEMENT SYSTEM
-- COMPLETE DATABASE MIGRATION SCRIPT
-- =====================================================
-- This script creates a complete pharmacy management database
-- Copy and paste this entire script into Supabase SQL Editor
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. DROP EXISTING TABLES (Clean Slate)
-- =====================================================
DROP TABLE IF EXISTS stock_movements CASCADE;
DROP TABLE IF EXISTS inventory_alerts CASCADE;
DROP TABLE IF EXISTS sale_items CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- =====================================================
-- 2. CREATE CORE TABLES
-- =====================================================

-- Categories Table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products Table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    brand VARCHAR(255),
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    batch_number VARCHAR(100) NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    min_stock_level INTEGER NOT NULL DEFAULT 10,
    cost_price DECIMAL(10,2) NOT NULL,
    selling_price DECIMAL(10,2) NOT NULL,
    expiry_date DATE NOT NULL,
    manufacturer VARCHAR(255),
    description TEXT,
    dosage VARCHAR(100),
    form VARCHAR(50), -- tablet, capsule, syrup, etc.
    strength VARCHAR(50), -- mg, ml, etc.
    barcode VARCHAR(100) UNIQUE,
    is_prescription BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT chk_positive_stock CHECK (stock_quantity >= 0),
    CONSTRAINT chk_positive_min_stock CHECK (min_stock_level >= 0),
    CONSTRAINT chk_positive_cost CHECK (cost_price >= 0),
    CONSTRAINT chk_positive_selling CHECK (selling_price >= 0),
    CONSTRAINT chk_future_expiry CHECK (expiry_date > '2020-01-01')
);

-- User Profiles Table (extends Supabase auth.users)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) NOT NULL DEFAULT 'cashier',
    phone VARCHAR(20),
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT chk_valid_role CHECK (role IN ('admin', 'pharmacist', 'cashier', 'manager', 'user'))
);

-- Sales Table
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_number VARCHAR(50) UNIQUE NOT NULL,
    sale_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    net_amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'cash',
    payment_status VARCHAR(20) DEFAULT 'completed',
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    customer_email VARCHAR(255),
    customer_address TEXT,
    prescription_number VARCHAR(100),
    doctor_name VARCHAR(255),
    cashier_id UUID REFERENCES auth.users(id),
    notes TEXT,
    receipt_printed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT chk_positive_total CHECK (total_amount >= 0),
    CONSTRAINT chk_positive_tax CHECK (tax_amount >= 0),
    CONSTRAINT chk_positive_discount CHECK (discount_amount >= 0),
    CONSTRAINT chk_valid_payment_method CHECK (payment_method IN ('cash', 'card', 'gcash', 'bank_transfer', 'check')),
    CONSTRAINT chk_valid_payment_status CHECK (payment_status IN ('pending', 'completed', 'cancelled', 'refunded'))
);

-- Sale Items Table
CREATE TABLE sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT chk_positive_quantity CHECK (quantity > 0),
    CONSTRAINT chk_positive_unit_price CHECK (unit_price >= 0),
    CONSTRAINT chk_positive_total_price CHECK (total_price >= 0),
    CONSTRAINT chk_positive_item_discount CHECK (discount_amount >= 0)
);

-- Stock Movements Table
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    movement_type VARCHAR(20) NOT NULL,
    quantity INTEGER NOT NULL,
    old_quantity INTEGER NOT NULL DEFAULT 0,
    new_quantity INTEGER NOT NULL DEFAULT 0,
    reason VARCHAR(255),
    reference_number VARCHAR(100),
    reference_id UUID,
    reference_type VARCHAR(50),
    batch_number VARCHAR(100),
    expiry_date DATE,
    cost_per_unit DECIMAL(10,2),
    supplier VARCHAR(255),
    performed_by UUID REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT chk_valid_movement_type CHECK (movement_type IN (
        'stock_in', 'stock_out', 'adjustment', 'sale', 'purchase', 
        'return', 'damage', 'expired', 'transfer', 'initial'
    )),
    CONSTRAINT chk_valid_reference_type CHECK (reference_type IN (
        'sale', 'purchase', 'adjustment', 'return', 'damage', 'expired', 'transfer', 'initial'
    ))
);

-- Inventory Alerts Table
CREATE TABLE inventory_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium',
    is_read BOOLEAN DEFAULT FALSE,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT chk_valid_alert_type CHECK (alert_type IN (
        'low_stock', 'out_of_stock', 'expiring_soon', 'expired', 
        'overstock', 'reorder', 'price_change', 'system'
    )),
    CONSTRAINT chk_valid_severity CHECK (severity IN ('low', 'medium', 'high', 'critical'))
);

-- =====================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Categories indexes
CREATE INDEX idx_categories_name ON categories(name);

-- Products indexes
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_generic_name ON products(generic_name);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_batch_number ON products(batch_number);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_expiry_date ON products(expiry_date);
CREATE INDEX idx_products_stock_quantity ON products(stock_quantity);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_low_stock ON products(stock_quantity, min_stock_level) WHERE stock_quantity <= min_stock_level;
CREATE INDEX idx_products_expiring ON products(expiry_date) WHERE expiry_date <= CURRENT_DATE + INTERVAL '30 days';

-- User profiles indexes
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_is_active ON user_profiles(is_active);

-- Sales indexes
CREATE INDEX idx_sales_sale_number ON sales(sale_number);
CREATE INDEX idx_sales_created_at ON sales(created_at);
CREATE INDEX idx_sales_cashier_id ON sales(cashier_id);
CREATE INDEX idx_sales_payment_status ON sales(payment_status);
CREATE INDEX idx_sales_customer_phone ON sales(customer_phone);
CREATE INDEX idx_sales_total_amount ON sales(total_amount);

-- Sale items indexes
CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product_id ON sale_items(product_id);

-- Stock movements indexes
CREATE INDEX idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_created_at ON stock_movements(created_at);
CREATE INDEX idx_stock_movements_movement_type ON stock_movements(movement_type);
CREATE INDEX idx_stock_movements_performed_by ON stock_movements(performed_by);
CREATE INDEX idx_stock_movements_reference ON stock_movements(reference_id, reference_type);

-- Inventory alerts indexes
CREATE INDEX idx_inventory_alerts_product_id ON inventory_alerts(product_id);
CREATE INDEX idx_inventory_alerts_alert_type ON inventory_alerts(alert_type);
CREATE INDEX idx_inventory_alerts_severity ON inventory_alerts(severity);
CREATE INDEX idx_inventory_alerts_is_read ON inventory_alerts(is_read);
CREATE INDEX idx_inventory_alerts_is_resolved ON inventory_alerts(is_resolved);
CREATE INDEX idx_inventory_alerts_created_at ON inventory_alerts(created_at);

-- =====================================================
-- 4. CREATE FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_alerts_updated_at BEFORE UPDATE ON inventory_alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate sale numbers
CREATE OR REPLACE FUNCTION generate_sale_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.sale_number IS NULL THEN
        NEW.sale_number := 'SALE-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('sale_number_seq')::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for sale numbers
CREATE SEQUENCE IF NOT EXISTS sale_number_seq START 1;

-- Create trigger for sale number generation
CREATE TRIGGER trigger_generate_sale_number
    BEFORE INSERT ON sales
    FOR EACH ROW
    EXECUTE FUNCTION generate_sale_number();

-- Function to create stock movements automatically
CREATE OR REPLACE FUNCTION create_stock_movement_on_sale()
RETURNS TRIGGER AS $$
BEGIN
    -- Get current stock quantity
    DECLARE
        current_stock INTEGER;
        product_batch VARCHAR(100);
    BEGIN
        SELECT stock_quantity, batch_number INTO current_stock, product_batch
        FROM products WHERE id = NEW.product_id;
        
        -- Create stock movement record
        INSERT INTO stock_movements (
            product_id,
            movement_type,
            quantity,
            old_quantity,
            new_quantity,
            reason,
            reference_id,
            reference_type,
            batch_number,
            performed_by
        )
        VALUES (
            NEW.product_id,
            'sale',
            -NEW.quantity,
            current_stock,
            current_stock - NEW.quantity,
            'Sale transaction',
            NEW.sale_id,
            'sale',
            product_batch,
            (SELECT cashier_id FROM sales WHERE id = NEW.sale_id)
        );
        
        -- Update product stock
        UPDATE products 
        SET stock_quantity = stock_quantity - NEW.quantity,
            updated_at = NOW()
        WHERE id = NEW.product_id;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic stock movement on sales
CREATE TRIGGER trigger_create_stock_movement_on_sale
    AFTER INSERT ON sale_items
    FOR EACH ROW
    EXECUTE FUNCTION create_stock_movement_on_sale();

-- Function to check for low stock and create alerts
CREATE OR REPLACE FUNCTION check_inventory_alerts()
RETURNS TRIGGER AS $$
BEGIN
    -- Remove existing alerts for this product
    DELETE FROM inventory_alerts 
    WHERE product_id = NEW.id 
    AND alert_type IN ('low_stock', 'out_of_stock');
    
    -- Check for out of stock
    IF NEW.stock_quantity = 0 THEN
        INSERT INTO inventory_alerts (
            product_id,
            alert_type,
            message,
            severity
        )
        VALUES (
            NEW.id,
            'out_of_stock',
            'Product "' || NEW.name || '" is out of stock',
            'critical'
        );
    -- Check for low stock
    ELSIF NEW.stock_quantity <= NEW.min_stock_level THEN
        INSERT INTO inventory_alerts (
            product_id,
            alert_type,
            message,
            severity
        )
        VALUES (
            NEW.id,
            'low_stock',
            'Product "' || NEW.name || '" is running low on stock (' || NEW.stock_quantity || ' remaining)',
            CASE 
                WHEN NEW.stock_quantity <= (NEW.min_stock_level * 0.3) THEN 'high'
                WHEN NEW.stock_quantity <= (NEW.min_stock_level * 0.6) THEN 'medium'
                ELSE 'low'
            END
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for inventory alerts
CREATE TRIGGER trigger_check_inventory_alerts
    AFTER UPDATE OF stock_quantity ON products
    FOR EACH ROW
    EXECUTE FUNCTION check_inventory_alerts();

-- Function to check for expiring products
CREATE OR REPLACE FUNCTION check_expiring_products()
RETURNS void AS $$
BEGIN
    -- Clear old expiring alerts (older than 7 days)
    DELETE FROM inventory_alerts 
    WHERE alert_type IN ('expiring_soon', 'expired')
    AND created_at < NOW() - INTERVAL '7 days';
    
    -- Create alerts for expired products
    INSERT INTO inventory_alerts (product_id, alert_type, message, severity)
    SELECT 
        id,
        'expired',
        'Product "' || name || '" has expired (Expiry: ' || TO_CHAR(expiry_date, 'YYYY-MM-DD') || ')',
        'critical'
    FROM products
    WHERE expiry_date < CURRENT_DATE
    AND is_active = TRUE
    AND stock_quantity > 0
    AND id NOT IN (
        SELECT product_id FROM inventory_alerts 
        WHERE alert_type = 'expired' 
        AND is_resolved = FALSE
        AND created_at > NOW() - INTERVAL '7 days'
    );
    
    -- Create alerts for products expiring within 30 days
    INSERT INTO inventory_alerts (product_id, alert_type, message, severity)
    SELECT 
        id,
        'expiring_soon',
        'Product "' || name || '" will expire soon (Expiry: ' || TO_CHAR(expiry_date, 'YYYY-MM-DD') || ')',
        CASE 
            WHEN expiry_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'high'
            WHEN expiry_date <= CURRENT_DATE + INTERVAL '14 days' THEN 'medium'
            ELSE 'low'
        END
    FROM products
    WHERE expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
    AND is_active = TRUE
    AND stock_quantity > 0
    AND id NOT IN (
        SELECT product_id FROM inventory_alerts 
        WHERE alert_type = 'expiring_soon' 
        AND is_resolved = FALSE
        AND created_at > NOW() - INTERVAL '7 days'
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_alerts ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. CREATE RLS POLICIES
-- =====================================================

-- Categories policies
CREATE POLICY "Allow admin and pharmacist to manage categories" ON categories 
    FOR ALL USING (get_user_role(auth.uid()) IN ('admin', 'pharmacist'));
CREATE POLICY "Allow cashier to view categories" ON categories 
    FOR SELECT USING (get_user_role(auth.uid()) = 'cashier');

-- Products policies
CREATE POLICY "Allow admin and pharmacist to manage products" ON products 
    FOR ALL USING (get_user_role(auth.uid()) IN ('admin', 'pharmacist'));
CREATE POLICY "Allow cashier to view products" ON products 
    FOR SELECT USING (get_user_role(auth.uid()) = 'cashier');

-- User profiles policies
CREATE POLICY "Users can view all profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage all profiles" ON user_profiles FOR ALL USING (
    get_user_role(auth.uid()) = 'admin'
);

-- Sales policies
CREATE POLICY "Allow all users to manage sales" ON sales FOR ALL USING (true) WITH CHECK (true);

-- Sale items policies
CREATE POLICY "Allow all users to manage sale_items" ON sale_items FOR ALL USING (true) WITH CHECK (true);

-- Stock movements policies
CREATE POLICY "Allow admin and pharmacist to manage stock_movements" ON stock_movements 
    FOR ALL USING (get_user_role(auth.uid()) IN ('admin', 'pharmacist'));
CREATE POLICY "Allow cashier to view stock_movements" ON stock_movements 
    FOR SELECT USING (get_user_role(auth.uid()) = 'cashier');

-- Inventory alerts policies
CREATE POLICY "Allow admin and pharmacist to manage inventory_alerts" ON inventory_alerts 
    FOR ALL USING (get_user_role(auth.uid()) IN ('admin', 'pharmacist'));
CREATE POLICY "Allow cashier to view inventory_alerts" ON inventory_alerts 
    FOR SELECT USING (get_user_role(auth.uid()) = 'cashier');

-- =====================================================
-- 7. INSERT SAMPLE DATA
-- =====================================================

-- Insert sample categories
INSERT INTO categories (name, description) VALUES
('Pain Relief', 'Medications for pain management and relief'),
('Antibiotics', 'Antimicrobial medications for treating infections'),
('Vitamins & Supplements', 'Essential vitamins and dietary supplements'),
('Cold & Flu', 'Medications for cold and flu symptoms'),
('Digestive Health', 'Medications for digestive and stomach issues'),
('Heart & Blood Pressure', 'Cardiovascular medications'),
('Diabetes Care', 'Medications and supplies for diabetes management'),
('Skin Care', 'Topical medications and skin care products'),
('Eye Care', 'Ophthalmic medications and eye care products'),
('First Aid', 'Emergency and first aid supplies');

-- Insert sample products
INSERT INTO products (
    name, generic_name, brand, category_id, batch_number, stock_quantity, 
    min_stock_level, cost_price, selling_price, expiry_date, manufacturer,
    description, dosage, form, strength, is_prescription
) VALUES
-- Pain Relief
('Paracetamol 500mg', 'Paracetamol', 'Biogesic', 
    (SELECT id FROM categories WHERE name = 'Pain Relief'), 
    'PAR001', 150, 20, 2.50, 5.00, '2026-12-31', 'Unilab Inc.',
    'For fever and mild to moderate pain relief', '500mg', 'tablet', '500mg', false),

('Ibuprofen 400mg', 'Ibuprofen', 'Advil', 
    (SELECT id FROM categories WHERE name = 'Pain Relief'), 
    'IBU001', 100, 15, 3.00, 6.50, '2026-10-15', 'Pfizer Inc.',
    'Non-steroidal anti-inflammatory drug', '400mg', 'tablet', '400mg', false),

-- Antibiotics
('Amoxicillin 500mg', 'Amoxicillin', 'Amoxil', 
    (SELECT id FROM categories WHERE name = 'Antibiotics'), 
    'AMX001', 80, 10, 8.50, 15.00, '2026-08-20', 'GSK Philippines',
    'Broad-spectrum antibiotic', '500mg', 'capsule', '500mg', true),

('Azithromycin 500mg', 'Azithromycin', 'Zithromax', 
    (SELECT id FROM categories WHERE name = 'Antibiotics'), 
    'AZI001', 60, 8, 25.00, 45.00, '2026-09-30', 'Pfizer Inc.',
    'Macrolide antibiotic', '500mg', 'tablet', '500mg', true),

-- Vitamins & Supplements
('Vitamin C 500mg', 'Ascorbic Acid', 'Cecon', 
    (SELECT id FROM categories WHERE name = 'Vitamins & Supplements'), 
    'VTC001', 200, 25, 1.50, 3.00, '2027-06-15', 'Unilab Inc.',
    'Essential vitamin for immune support', '500mg', 'tablet', '500mg', false),

('Multivitamins', 'Multivitamin Complex', 'Centrum', 
    (SELECT id FROM categories WHERE name = 'Vitamins & Supplements'), 
    'MVI001', 120, 20, 12.00, 22.00, '2027-03-10', 'Pfizer Inc.',
    'Complete daily multivitamin', '1 tablet daily', 'tablet', 'Adult Formula', false),

-- Cold & Flu
('Loratadine 10mg', 'Loratadine', 'Claritin', 
    (SELECT id FROM categories WHERE name = 'Cold & Flu'), 
    'LOR001', 90, 15, 4.50, 8.00, '2026-11-25', 'Schering-Plough',
    'Antihistamine for allergies', '10mg', 'tablet', '10mg', false),

('Phenylephrine + Paracetamol', 'Phenylephrine HCl + Paracetamol', 'Neozep', 
    (SELECT id FROM categories WHERE name = 'Cold & Flu'), 
    'NEO001', 75, 12, 3.25, 6.50, '2026-12-05', 'Unilab Inc.',
    'For colds, fever, and nasal congestion', '1 tablet', 'tablet', 'Adult', false),

-- Digestive Health
('Loperamide 2mg', 'Loperamide HCl', 'Imodium', 
    (SELECT id FROM categories WHERE name = 'Digestive Health'), 
    'LOP001', 50, 8, 6.00, 12.00, '2026-10-30', 'Johnson & Johnson',
    'Anti-diarrheal medication', '2mg', 'capsule', '2mg', false),

('Omeprazole 20mg', 'Omeprazole', 'Losec', 
    (SELECT id FROM categories WHERE name = 'Digestive Health'), 
    'OME001', 40, 6, 15.00, 28.00, '2026-09-15', 'AstraZeneca',
    'Proton pump inhibitor for acid reflux', '20mg', 'capsule', '20mg', true);

-- Insert sample user profiles (for demo purposes)
INSERT INTO user_profiles (id, email, first_name, last_name, role, phone) VALUES
(gen_random_uuid(), 'admin@medcure.com', 'System', 'Administrator', 'admin', '+63 917 123 4567'),
(gen_random_uuid(), 'pharmacist@medcure.com', 'Maria', 'Santos', 'pharmacist', '+63 917 234 5678'),
(gen_random_uuid(), 'cashier@medcure.com', 'Juan', 'Dela Cruz', 'cashier', '+63 917 345 6789');

-- Insert sample stock movements
INSERT INTO stock_movements (
    product_id, movement_type, quantity, old_quantity, new_quantity, 
    reason, reference_type, batch_number
) 
SELECT 
    p.id,
    'initial',
    p.stock_quantity,
    0,
    p.stock_quantity,
    'Initial stock entry',
    'initial',
    p.batch_number
FROM products p;

-- Run expiring products check
SELECT check_expiring_products();

-- =====================================================
-- 8. CREATE HELPFUL VIEWS
-- =====================================================

-- View for low stock products
CREATE OR REPLACE VIEW low_stock_products AS
SELECT 
    p.*,
    c.name as category_name,
    (p.min_stock_level - p.stock_quantity) as shortage_quantity
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.stock_quantity <= p.min_stock_level
AND p.is_active = true
ORDER BY (p.stock_quantity::float / p.min_stock_level::float) ASC;

-- View for expiring products
CREATE OR REPLACE VIEW expiring_products AS
SELECT 
    p.*,
    c.name as category_name,
    (p.expiry_date - CURRENT_DATE) as days_until_expiry
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.expiry_date <= CURRENT_DATE + INTERVAL '30 days'
AND p.is_active = true
AND p.stock_quantity > 0
ORDER BY p.expiry_date ASC;

-- View for sales summary
CREATE OR REPLACE VIEW daily_sales_summary AS
SELECT 
    DATE(s.created_at) as sale_date,
    COUNT(s.id) as total_transactions,
    SUM(s.total_amount) as total_sales,
    SUM(s.tax_amount) as total_tax,
    SUM(s.discount_amount) as total_discounts,
    AVG(s.total_amount) as average_transaction
FROM sales s
WHERE s.payment_status = 'completed'
GROUP BY DATE(s.created_at)
ORDER BY sale_date DESC;

-- View for product performance
CREATE OR REPLACE VIEW product_sales_performance AS
SELECT 
    p.id,
    p.name,
    p.generic_name,
    c.name as category_name,
    COUNT(si.id) as times_sold,
    SUM(si.quantity) as total_quantity_sold,
    SUM(si.total_price) as total_revenue,
    AVG(si.unit_price) as average_selling_price,
    p.stock_quantity as current_stock
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN sale_items si ON p.id = si.product_id
LEFT JOIN sales s ON si.sale_id = s.id AND s.payment_status = 'completed'
WHERE p.is_active = true
GROUP BY p.id, p.name, p.generic_name, c.name, p.stock_quantity
ORDER BY total_revenue DESC NULLS LAST;

-- =====================================================
-- 9. CREATE UTILITY FUNCTIONS
-- =====================================================

-- Function to get inventory summary
CREATE OR REPLACE FUNCTION get_inventory_summary()
RETURNS TABLE (
    total_products BIGINT,
    total_value NUMERIC,
    low_stock_count BIGINT,
    expired_count BIGINT,
    expiring_soon_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_products,
        SUM(stock_quantity * selling_price)::NUMERIC as total_value,
        COUNT(*) FILTER (WHERE stock_quantity <= min_stock_level)::BIGINT as low_stock_count,
        COUNT(*) FILTER (WHERE expiry_date < CURRENT_DATE)::BIGINT as expired_count,
        COUNT(*) FILTER (WHERE expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days')::BIGINT as expiring_soon_count
    FROM products
    WHERE is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Function to generate stock report
CREATE OR REPLACE FUNCTION generate_stock_report(
    p_category_id UUID DEFAULT NULL,
    p_low_stock_only BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    product_id UUID,
    product_name VARCHAR,
    category_name VARCHAR,
    batch_number VARCHAR,
    current_stock INTEGER,
    min_stock_level INTEGER,
    stock_value NUMERIC,
    days_until_expiry INTEGER,
    status VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as product_id,
        p.name as product_name,
        c.name as category_name,
        p.batch_number,
        p.stock_quantity as current_stock,
        p.min_stock_level,
        (p.stock_quantity * p.selling_price)::NUMERIC as stock_value,
        (p.expiry_date - CURRENT_DATE)::INTEGER as days_until_expiry,
        CASE 
            WHEN p.expiry_date < CURRENT_DATE THEN 'EXPIRED'
            WHEN p.stock_quantity = 0 THEN 'OUT_OF_STOCK'
            WHEN p.stock_quantity <= p.min_stock_level THEN 'LOW_STOCK'
            WHEN p.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'EXPIRING_SOON'
            ELSE 'GOOD'
        END as status
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.is_active = true
    AND (p_category_id IS NULL OR p.category_id = p_category_id)
    AND (p_low_stock_only = FALSE OR p.stock_quantity <= p.min_stock_level)
    ORDER BY 
        CASE 
            WHEN p.expiry_date < CURRENT_DATE THEN 1
            WHEN p.stock_quantity = 0 THEN 2
            WHEN p.stock_quantity <= p.min_stock_level THEN 3
            WHEN p.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 4
            ELSE 5
        END,
        p.expiry_date ASC,
        p.name ASC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9B. CRITICAL RPC FUNCTIONS FOR APPLICATION
-- =====================================================

-- Function to process sales
CREATE OR REPLACE FUNCTION process_sale(
    p_items JSONB,
    p_customer_name TEXT DEFAULT NULL,
    p_customer_phone TEXT DEFAULT NULL,
    p_payment_method TEXT DEFAULT 'cash',
    p_discount_amount NUMERIC DEFAULT 0,
    p_tax_rate NUMERIC DEFAULT 0.12
)
RETURNS JSONB AS $$
DECLARE
    v_sale_id UUID;
    v_sale_number TEXT;
    v_total_amount NUMERIC := 0;
    v_tax_amount NUMERIC := 0;
    v_net_amount NUMERIC := 0;
    v_item JSONB;
    v_product RECORD;
    v_line_total NUMERIC;
BEGIN
    -- Generate sale number
    v_sale_number := 'SALE-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('sale_sequence')::TEXT, 4, '0');
    
    -- Calculate totals from items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        SELECT * INTO v_product FROM products WHERE id = (v_item->>'product_id')::UUID;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product not found: %', v_item->>'product_id';
        END IF;
        
        IF v_product.stock_quantity < (v_item->>'quantity')::INTEGER THEN
            RAISE EXCEPTION 'Insufficient stock for product: % (Available: %, Requested: %)', 
                v_product.name, v_product.stock_quantity, (v_item->>'quantity')::INTEGER;
        END IF;
        
        v_line_total := (v_item->>'quantity')::NUMERIC * (v_item->>'unit_price')::NUMERIC;
        v_total_amount := v_total_amount + v_line_total;
    END LOOP;
    
    -- Calculate tax and net amount
    v_tax_amount := (v_total_amount - p_discount_amount) * p_tax_rate;
    v_net_amount := v_total_amount - p_discount_amount + v_tax_amount;
    
    -- Insert sale record
    INSERT INTO sales (
        sale_number, sale_date, total_amount, tax_amount, discount_amount, 
        net_amount, payment_method, customer_name, customer_phone, cashier_id
    ) VALUES (
        v_sale_number, NOW(), v_total_amount, v_tax_amount, p_discount_amount,
        v_net_amount, p_payment_method, p_customer_name, p_customer_phone, auth.uid()
    ) RETURNING id INTO v_sale_id;
    
    -- Insert sale items and update stock
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        -- Insert sale item
        INSERT INTO sale_items (
            sale_id, product_id, quantity, unit_price, total_price
        ) VALUES (
            v_sale_id,
            (v_item->>'product_id')::UUID,
            (v_item->>'quantity')::INTEGER,
            (v_item->>'unit_price')::NUMERIC,
            (v_item->>'quantity')::NUMERIC * (v_item->>'unit_price')::NUMERIC
        );
        
        -- Update product stock
        UPDATE products 
        SET stock_quantity = stock_quantity - (v_item->>'quantity')::INTEGER,
            updated_at = NOW()
        WHERE id = (v_item->>'product_id')::UUID;
        
        -- Create stock movement record
        INSERT INTO stock_movements (
            product_id, movement_type, quantity, reason, reference_id, reference_type, performed_by
        ) VALUES (
            (v_item->>'product_id')::UUID,
            'stock_out',
            -(v_item->>'quantity')::INTEGER,
            'Sale transaction',
            v_sale_id,
            'sale',
            auth.uid()
        );
    END LOOP;
    
    -- Return sale details
    RETURN jsonb_build_object(
        'success', true,
        'sale_id', v_sale_id,
        'sale_number', v_sale_number,
        'total_amount', v_total_amount,
        'tax_amount', v_tax_amount,
        'discount_amount', p_discount_amount,
        'net_amount', v_net_amount
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create sequence for sale numbers
CREATE SEQUENCE IF NOT EXISTS sale_sequence START 1;

-- Function to get dashboard analytics
CREATE OR REPLACE FUNCTION get_dashboard_analytics()
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_today_sales NUMERIC;
    v_month_sales NUMERIC;
    v_total_products INTEGER;
    v_low_stock_count INTEGER;
    v_expired_count INTEGER;
    v_expiring_soon_count INTEGER;
    v_recent_sales JSONB;
    v_top_products JSONB;
BEGIN
    -- Today's sales
    SELECT COALESCE(SUM(net_amount), 0) INTO v_today_sales
    FROM sales 
    WHERE DATE(sale_date) = CURRENT_DATE AND payment_status = 'completed';
    
    -- This month's sales
    SELECT COALESCE(SUM(net_amount), 0) INTO v_month_sales
    FROM sales 
    WHERE DATE_TRUNC('month', sale_date) = DATE_TRUNC('month', CURRENT_DATE) 
    AND payment_status = 'completed';
    
    -- Product counts
    SELECT COUNT(*) INTO v_total_products FROM products WHERE is_active = true;
    SELECT COUNT(*) INTO v_low_stock_count FROM products WHERE stock_quantity <= min_stock_level AND is_active = true;
    SELECT COUNT(*) INTO v_expired_count FROM products WHERE expiry_date < CURRENT_DATE AND is_active = true;
    SELECT COUNT(*) INTO v_expiring_soon_count FROM products WHERE expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' AND is_active = true;
    
    -- Recent sales (last 5)
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', s.id,
            'sale_number', s.sale_number,
            'sale_date', s.sale_date,
            'total_amount', s.net_amount,
            'customer_name', COALESCE(s.customer_name, 'Walk-in Customer'),
            'items_count', (SELECT COUNT(*) FROM sale_items WHERE sale_id = s.id)
        )
    ) INTO v_recent_sales
    FROM (
        SELECT * FROM sales 
        WHERE payment_status = 'completed' 
        ORDER BY sale_date DESC 
        LIMIT 5
    ) s;
    
    -- Top selling products this month
    SELECT jsonb_agg(
        jsonb_build_object(
            'product_name', p.name,
            'total_sold', COALESCE(SUM(si.quantity), 0),
            'total_revenue', COALESCE(SUM(si.total_price), 0)
        )
    ) INTO v_top_products
    FROM products p
    LEFT JOIN sale_items si ON p.id = si.product_id
    LEFT JOIN sales s ON si.sale_id = s.id 
        AND DATE_TRUNC('month', s.sale_date) = DATE_TRUNC('month', CURRENT_DATE)
        AND s.payment_status = 'completed'
    WHERE p.is_active = true
    GROUP BY p.id, p.name
    HAVING COALESCE(SUM(si.quantity), 0) > 0
    ORDER BY COALESCE(SUM(si.quantity), 0) DESC
    LIMIT 5;
    
    -- Build result
    v_result := jsonb_build_object(
        'today_sales', v_today_sales,
        'month_sales', v_month_sales,
        'total_products', v_total_products,
        'low_stock_products', v_low_stock_count,
        'expired_products', v_expired_count,
        'expiring_soon_products', v_expiring_soon_count,
        'recent_sales', COALESCE(v_recent_sales, '[]'::jsonb),
        'top_products', COALESCE(v_top_products, '[]'::jsonb)
    );
    
    RETURN v_result;
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'error', SQLERRM,
        'today_sales', 0,
        'month_sales', 0,
        'total_products', 0,
        'low_stock_products', 0,
        'expired_products', 0,
        'expiring_soon_products', 0,
        'recent_sales', '[]'::jsonb,
        'top_products', '[]'::jsonb
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle new user registration
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

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to get user role (helper function for RLS)
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
BEGIN
    RETURN (SELECT role FROM user_profiles WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add stock (for restocking)
CREATE OR REPLACE FUNCTION add_stock(
    p_product_id UUID,
    p_quantity INTEGER,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_product products%ROWTYPE;
    v_movement_id UUID;
    result JSON;
BEGIN
    -- Get product details
    SELECT * INTO v_product FROM products WHERE id = p_product_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Product not found'
        );
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
        COALESCE(p_notes, 'Stock added via system'),
        auth.uid()
    ) RETURNING id INTO v_movement_id;
    
    -- Check for low stock alerts
    IF (v_product.stock_quantity + p_quantity) <= v_product.reorder_level THEN
        INSERT INTO inventory_alerts (
            product_id,
            alert_type,
            message,
            severity
        ) VALUES (
            p_product_id,
            'low_stock',
            'Product stock is at or below reorder level',
            'medium'
        ) ON CONFLICT (product_id, alert_type) DO NOTHING;
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Stock added successfully',
        'movement_id', v_movement_id,
        'new_quantity', v_product.stock_quantity + p_quantity
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove stock (for adjustments/damages)
CREATE OR REPLACE FUNCTION remove_stock(
    p_product_id UUID,
    p_quantity INTEGER,
    p_reason TEXT DEFAULT 'Stock adjustment'
)
RETURNS JSON AS $$
DECLARE
    v_product products%ROWTYPE;
    v_movement_id UUID;
    result JSON;
BEGIN
    -- Get product details
    SELECT * INTO v_product FROM products WHERE id = p_product_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Product not found'
        );
    END IF;
    
    -- Check if sufficient stock
    IF v_product.stock_quantity < p_quantity THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Insufficient stock available'
        );
    END IF;
    
    -- Update product stock
    UPDATE products 
    SET stock_quantity = stock_quantity - p_quantity,
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
        'out',
        p_quantity,
        p_reason,
        auth.uid()
    ) RETURNING id INTO v_movement_id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Stock removed successfully',
        'movement_id', v_movement_id,
        'new_quantity', v_product.stock_quantity - p_quantity
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get product stock movements
CREATE OR REPLACE FUNCTION get_product_movements(p_product_id UUID)
RETURNS TABLE (
    id UUID,
    movement_type TEXT,
    quantity INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ,
    created_by_email TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sm.id,
        sm.movement_type,
        sm.quantity,
        sm.notes,
        sm.created_at,
        COALESCE(up.email, 'System') as created_by_email
    FROM stock_movements sm
    LEFT JOIN user_profiles up ON sm.created_by = up.id
    WHERE sm.product_id = p_product_id
    ORDER BY sm.created_at DESC;
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
    ORDER BY p.stock_quantity ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 10. SUCCESS MESSAGE AND COMPLETION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'MEDCURE PHARMACY MIGRATION COMPLETED!';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Database schema has been successfully created with:';
    RAISE NOTICE '✓ All required tables with proper relationships';
    RAISE NOTICE '✓ Row Level Security (RLS) policies configured';
    RAISE NOTICE '✓ User roles and permissions system';
    RAISE NOTICE '✓ Automated triggers for user profiles';
    RAISE NOTICE '✓ Comprehensive RPC functions for business logic';
    RAISE NOTICE '✓ Sample data for testing';
    RAISE NOTICE '';
    RAISE NOTICE 'NEXT STEPS:';
    RAISE NOTICE '1. Create your first admin user by signing up';
    RAISE NOTICE '2. The system will auto-assign roles based on email:';
    RAISE NOTICE '   - *admin* emails get admin role';
    RAISE NOTICE '   - *pharmacist* emails get pharmacist role';
    RAISE NOTICE '   - Other emails get cashier role';
    RAISE NOTICE '3. Admin users can manage products and inventory';
    RAISE NOTICE '4. All users can process sales transactions';
    RAISE NOTICE '';
    RAISE NOTICE 'AVAILABLE RPC FUNCTIONS:';
    RAISE NOTICE '- process_sale(items, customer_name, payment_method)';
    RAISE NOTICE '- get_dashboard_analytics()';
    RAISE NOTICE '- add_stock(product_id, quantity, notes)';
    RAISE NOTICE '- remove_stock(product_id, quantity, reason)';
    RAISE NOTICE '- get_product_movements(product_id)';
    RAISE NOTICE '- get_low_stock_products()';
    RAISE NOTICE '- get_user_role(user_id)';
    RAISE NOTICE '';
    RAISE NOTICE 'Your Medcure Pharmacy Management System is ready!';
    RAISE NOTICE '===========================================';
END $$;

SELECT 
    'SUCCESS: Medcure Pharmacy Management System database has been successfully created!' as status,
    'Tables Created: ' || (
        SELECT COUNT(*) FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('categories', 'products', 'user_profiles', 'sales', 'sale_items', 'stock_movements', 'inventory_alerts')
    ) as tables_count,
    'Sample Products: ' || (SELECT COUNT(*) FROM products) as products_count,
    'Sample Categories: ' || (SELECT COUNT(*) FROM categories) as categories_count,
    'Current Timestamp: ' || NOW() as created_at;

-- =====================================================
-- END OF MIGRATION SCRIPT
-- =====================================================
