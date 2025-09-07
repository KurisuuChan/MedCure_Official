-- Database Fix: Create missing users table and update schema
-- This script fixes the missing users table error

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    role VARCHAR(50) DEFAULT 'cashier' CHECK (role IN ('admin', 'pharmacist', 'cashier')),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger for users table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user if no users exist
INSERT INTO public.users (email, password_hash, role, first_name, last_name)
SELECT 'admin@medcure.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'Admin', 'User'
WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE email = 'admin@medcure.com');

-- Insert default pharmacist user
INSERT INTO public.users (email, password_hash, role, first_name, last_name)
SELECT 'pharmacist@medcure.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'pharmacist', 'John', 'Pharmacist'
WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE email = 'pharmacist@medcure.com');

-- Insert default cashier user
INSERT INTO public.users (email, password_hash, role, first_name, last_name)
SELECT 'cashier@medcure.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'cashier', 'Jane', 'Cashier'
WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE email = 'cashier@medcure.com');

-- Create stock_movements table for tracking inventory changes
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    movement_type VARCHAR(50) NOT NULL CHECK (movement_type IN ('sale', 'purchase', 'adjustment', 'expired', 'damaged', 'return')),
    quantity_change INTEGER NOT NULL,
    previous_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    unit_cost DECIMAL(10,2),
    notes TEXT,
    reference_number VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add user_id column if it doesn't exist (for backward compatibility)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'stock_movements' AND column_name = 'user_id') THEN
        ALTER TABLE stock_movements ADD COLUMN user_id UUID;
        -- Add foreign key constraint after column is created
        ALTER TABLE stock_movements ADD CONSTRAINT fk_stock_movements_user_id 
            FOREIGN KEY (user_id) REFERENCES users(id);
    END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_user_id ON stock_movements(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at);

-- Create sales table for transaction tracking
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sale_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id),
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    payment_method VARCHAR(50) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'digital_wallet', 'bank_transfer')),
    payment_status VARCHAR(50) DEFAULT 'completed' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sale_items table for individual sale items
CREATE TABLE IF NOT EXISTS public.sale_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create triggers for sales table
DROP TRIGGER IF EXISTS update_sales_updated_at ON sales;
CREATE TRIGGER update_sales_updated_at 
    BEFORE UPDATE ON sales 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);

-- Enable RLS (Row Level Security) for all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text OR EXISTS (
        SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role IN ('admin', 'pharmacist')
    ));

DROP POLICY IF EXISTS "Admins can manage all users" ON users;
CREATE POLICY "Admins can manage all users" ON users
    FOR ALL USING (EXISTS (
        SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'
    ));

-- Create RLS policies for stock_movements table
DROP POLICY IF EXISTS "All authenticated users can view stock movements" ON stock_movements;
CREATE POLICY "All authenticated users can view stock movements" ON stock_movements
    FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "All authenticated users can insert stock movements" ON stock_movements;
CREATE POLICY "All authenticated users can insert stock movements" ON stock_movements
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Create RLS policies for sales table
DROP POLICY IF EXISTS "All authenticated users can view sales" ON sales;
CREATE POLICY "All authenticated users can view sales" ON sales
    FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "All authenticated users can manage sales" ON sales;
CREATE POLICY "All authenticated users can manage sales" ON sales
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Create RLS policies for sale_items table
DROP POLICY IF EXISTS "All authenticated users can view sale items" ON sale_items;
CREATE POLICY "All authenticated users can view sale items" ON sale_items
    FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "All authenticated users can manage sale items" ON sale_items;
CREATE POLICY "All authenticated users can manage sale items" ON sale_items
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Create function to generate sale numbers
CREATE OR REPLACE FUNCTION generate_sale_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    date_part TEXT;
    sequence_part INTEGER;
BEGIN
    date_part := TO_CHAR(NOW(), 'YYYYMMDD');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(sale_number FROM 10) AS INTEGER)), 0) + 1
    INTO sequence_part
    FROM sales
    WHERE sale_number LIKE 'INV' || date_part || '%';
    
    new_number := 'INV' || date_part || LPAD(sequence_part::TEXT, 4, '0');
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Create function to track stock movements automatically
CREATE OR REPLACE FUNCTION track_stock_movement()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
    user_id_exists BOOLEAN;
BEGIN
    -- Check if user_id column exists in stock_movements table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stock_movements' AND column_name = 'user_id'
    ) INTO user_id_exists;
    
    -- Get current user ID, fallback to NULL if not available
    current_user_id := auth.uid();
    
    -- Only track for UPDATE operations on products table
    IF TG_OP = 'UPDATE' AND OLD.stock_quantity != NEW.stock_quantity THEN
        IF user_id_exists THEN
            INSERT INTO stock_movements (
                product_id,
                user_id,
                movement_type,
                quantity_change,
                previous_quantity,
                new_quantity,
                notes
            ) VALUES (
                NEW.id,
                current_user_id,
                CASE 
                    WHEN NEW.stock_quantity > OLD.stock_quantity THEN 'purchase'
                    WHEN NEW.stock_quantity < OLD.stock_quantity THEN 'sale'
                    ELSE 'adjustment'
                END,
                NEW.stock_quantity - OLD.stock_quantity,
                OLD.stock_quantity,
                NEW.stock_quantity,
                'Automatic stock tracking from product update'
            );
        ELSE
            -- Insert without user_id if column doesn't exist
            INSERT INTO stock_movements (
                product_id,
                movement_type,
                quantity_change,
                previous_quantity,
                new_quantity,
                notes
            ) VALUES (
                NEW.id,
                CASE 
                    WHEN NEW.stock_quantity > OLD.stock_quantity THEN 'purchase'
                    WHEN NEW.stock_quantity < OLD.stock_quantity THEN 'sale'
                    ELSE 'adjustment'
                END,
                NEW.stock_quantity - OLD.stock_quantity,
                OLD.stock_quantity,
                NEW.stock_quantity,
                'Automatic stock tracking from product update'
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic stock movement tracking
DROP TRIGGER IF EXISTS auto_track_stock_movement ON products;
CREATE TRIGGER auto_track_stock_movement
    AFTER UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION track_stock_movement();

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Refresh the schema
NOTIFY pgrst, 'reload schema';
