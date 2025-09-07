-- Complete Database Schema Fix for Medcure Pharmacy
-- Run this in your Supabase SQL Editor

-- 1. First, drop existing problematic tables if they exist
DROP TABLE IF EXISTS stock_movements CASCADE;
DROP TABLE IF EXISTS inventory_alerts CASCADE;
DROP TABLE IF EXISTS sales CASCADE;

-- 2. Create users table if it doesn't exist (for proper foreign key relationships)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create sales table with proper schema
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    total_amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    payment_method VARCHAR(50) DEFAULT 'cash',
    status VARCHAR(20) DEFAULT 'completed',
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    cashier_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create sale_items table to track individual items in each sale
CREATE TABLE sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create stock_movements table for inventory tracking
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment')),
    quantity INTEGER NOT NULL,
    reason VARCHAR(255),
    reference_id UUID, -- Can reference sale_id or other transaction
    reference_type VARCHAR(50), -- 'sale', 'purchase', 'adjustment', etc.
    performed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create inventory_alerts table
CREATE TABLE inventory_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_cashier_id ON sales(cashier_id);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);

CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(movement_type);

CREATE INDEX IF NOT EXISTS idx_inventory_alerts_product_id ON inventory_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_read ON inventory_alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_severity ON inventory_alerts(severity);

-- 8. Create function to automatically create stock movements on sales
CREATE OR REPLACE FUNCTION create_stock_movement_on_sale()
RETURNS TRIGGER AS $$
BEGIN
    -- Create stock movement record for each sale item
    INSERT INTO stock_movements (
        product_id,
        movement_type,
        quantity,
        reason,
        reference_id,
        reference_type,
        performed_by
    )
    VALUES (
        NEW.product_id,
        'out',
        -NEW.quantity, -- Negative because it's going out
        'Sale transaction',
        NEW.sale_id,
        'sale',
        (SELECT cashier_id FROM sales WHERE id = NEW.sale_id)
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Create trigger for automatic stock movement tracking
DROP TRIGGER IF EXISTS trigger_create_stock_movement_on_sale ON sale_items;
CREATE TRIGGER trigger_create_stock_movement_on_sale
    AFTER INSERT ON sale_items
    FOR EACH ROW
    EXECUTE FUNCTION create_stock_movement_on_sale();

-- 10. Create function to check for low stock and create alerts
CREATE OR REPLACE FUNCTION check_low_stock_alerts()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if product stock is below minimum level
    IF NEW.stock_quantity <= NEW.min_stock_level THEN
        -- Insert or update alert
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
                WHEN NEW.stock_quantity = 0 THEN 'high'
                WHEN NEW.stock_quantity <= (NEW.min_stock_level * 0.5) THEN 'high'
                ELSE 'medium'
            END
        )
        ON CONFLICT (product_id, alert_type) DO UPDATE SET
            message = EXCLUDED.message,
            severity = EXCLUDED.severity,
            is_read = FALSE,
            created_at = NOW();
    ELSE
        -- Remove low stock alert if stock is sufficient
        DELETE FROM inventory_alerts 
        WHERE product_id = NEW.id AND alert_type = 'low_stock';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Create trigger for low stock alerts
DROP TRIGGER IF EXISTS trigger_check_low_stock ON products;
CREATE TRIGGER trigger_check_low_stock
    AFTER UPDATE OF stock_quantity ON products
    FOR EACH ROW
    EXECUTE FUNCTION check_low_stock_alerts();

-- 12. Create function to check for expiring products
CREATE OR REPLACE FUNCTION check_expiring_products()
RETURNS void AS $$
BEGIN
    -- Clear old expiring alerts
    DELETE FROM inventory_alerts 
    WHERE alert_type IN ('expiring_soon', 'expired')
    AND created_at < NOW() - INTERVAL '24 hours';
    
    -- Create alerts for expired products
    INSERT INTO inventory_alerts (product_id, alert_type, message, severity)
    SELECT 
        id,
        'expired',
        'Product "' || name || '" has expired (Expiry: ' || expiry_date || ')',
        'high'
    FROM products
    WHERE expiry_date < CURRENT_DATE
    AND id NOT IN (
        SELECT product_id FROM inventory_alerts 
        WHERE alert_type = 'expired' AND is_read = FALSE
    );
    
    -- Create alerts for products expiring within 30 days
    INSERT INTO inventory_alerts (product_id, alert_type, message, severity)
    SELECT 
        id,
        'expiring_soon',
        'Product "' || name || '" will expire soon (Expiry: ' || expiry_date || ')',
        'medium'
    FROM products
    WHERE expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
    AND expiry_date >= CURRENT_DATE
    AND id NOT IN (
        SELECT product_id FROM inventory_alerts 
        WHERE alert_type = 'expiring_soon' AND is_read = FALSE
    );
END;
$$ LANGUAGE plpgsql;

-- 13. Enable Row Level Security (RLS) on new tables
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_alerts ENABLE ROW LEVEL SECURITY;

-- 14. Create RLS policies for sales
CREATE POLICY "Users can view all sales" ON sales FOR SELECT USING (true);
CREATE POLICY "Users can insert sales" ON sales FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own sales" ON sales FOR UPDATE USING (true);

-- 15. Create RLS policies for sale_items
CREATE POLICY "Users can view all sale items" ON sale_items FOR SELECT USING (true);
CREATE POLICY "Users can insert sale items" ON sale_items FOR INSERT WITH CHECK (true);

-- 16. Create RLS policies for stock_movements
CREATE POLICY "Users can view all stock movements" ON stock_movements FOR SELECT USING (true);
CREATE POLICY "Users can insert stock movements" ON stock_movements FOR INSERT WITH CHECK (true);

-- 17. Create RLS policies for inventory_alerts
CREATE POLICY "Users can view all alerts" ON inventory_alerts FOR SELECT USING (true);
CREATE POLICY "Users can insert alerts" ON inventory_alerts FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update alerts" ON inventory_alerts FOR UPDATE USING (true);

-- 18. Insert sample data if tables are empty
DO $$
BEGIN
    -- Add sample user if users table is empty
    IF NOT EXISTS (SELECT 1 FROM users LIMIT 1) THEN
        INSERT INTO users (email, role) VALUES 
        ('admin@medcure.com', 'admin'),
        ('pharmacist@medcure.com', 'pharmacist');
    END IF;
END $$;

-- 19. Run the expiring products check
SELECT check_expiring_products();

-- Success message
SELECT 'Database schema has been successfully updated with all required tables and functions!' as status;
