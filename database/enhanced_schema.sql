-- Stock movements audit table for tracking all inventory changes
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment', 'transfer', 'return', 'damage', 'expired')),
  quantity_before INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  quantity_changed INTEGER NOT NULL,
  unit_cost DECIMAL(10,2),
  reference_number VARCHAR(100), -- Purchase order, invoice, prescription number, etc.
  reason VARCHAR(500),
  location VARCHAR(100),
  batch_number VARCHAR(100),
  expiry_date DATE,
  supplier_id UUID REFERENCES suppliers(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Suppliers table for tracking vendors
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  tax_id VARCHAR(50),
  payment_terms VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchase orders table
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  po_number VARCHAR(100) UNIQUE NOT NULL,
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  user_id UUID NOT NULL REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'confirmed', 'received', 'cancelled')),
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery DATE,
  total_amount DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchase order items
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_cost DECIMAL(10,2) NOT NULL,
  total_cost DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  received_quantity INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prescriptions table for pharmacy-specific tracking
CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prescription_number VARCHAR(100) UNIQUE NOT NULL,
  patient_name VARCHAR(255) NOT NULL,
  patient_phone VARCHAR(50),
  doctor_name VARCHAR(255),
  doctor_license VARCHAR(100),
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'filled', 'partial', 'cancelled', 'returned')),
  total_amount DECIMAL(10,2) DEFAULT 0,
  user_id UUID NOT NULL REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prescription items
CREATE TABLE IF NOT EXISTS prescription_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity_prescribed INTEGER NOT NULL CHECK (quantity_prescribed > 0),
  quantity_dispensed INTEGER DEFAULT 0,
  dosage VARCHAR(100),
  frequency VARCHAR(100),
  duration VARCHAR(100),
  instructions TEXT,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity_dispensed * unit_price) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_user_id ON stock_movements(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(movement_type);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_date ON purchase_orders(order_date);

CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status);
CREATE INDEX IF NOT EXISTS idx_prescriptions_date ON prescriptions(issue_date);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_name);

-- Enable RLS (Row Level Security)
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all stock movements" ON stock_movements FOR SELECT USING (true);
CREATE POLICY "Admin and pharmacist can insert stock movements" ON stock_movements FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'pharmacist'))
);

CREATE POLICY "Users can view suppliers" ON suppliers FOR SELECT USING (true);
CREATE POLICY "Admin can manage suppliers" ON suppliers FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users can view purchase orders" ON purchase_orders FOR SELECT USING (true);
CREATE POLICY "Admin and pharmacist can manage purchase orders" ON purchase_orders FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'pharmacist'))
);

CREATE POLICY "Users can view purchase order items" ON purchase_order_items FOR SELECT USING (true);
CREATE POLICY "Admin and pharmacist can manage purchase order items" ON purchase_order_items FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'pharmacist'))
);

CREATE POLICY "Users can view prescriptions" ON prescriptions FOR SELECT USING (true);
CREATE POLICY "Admin and pharmacist can manage prescriptions" ON prescriptions FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'pharmacist'))
);

CREATE POLICY "Users can view prescription items" ON prescription_items FOR SELECT USING (true);
CREATE POLICY "Admin and pharmacist can manage prescription items" ON prescription_items FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'pharmacist'))
);

-- Trigger function to log stock movements
CREATE OR REPLACE FUNCTION log_stock_movement()
RETURNS TRIGGER AS $$
BEGIN
  -- Log stock changes when products are updated
  IF TG_OP = 'UPDATE' AND OLD.stock_quantity != NEW.stock_quantity THEN
    INSERT INTO stock_movements (
      product_id,
      user_id,
      movement_type,
      quantity_before,
      quantity_after,
      quantity_changed,
      reason,
      batch_number
    ) VALUES (
      NEW.id,
      COALESCE(auth.uid(), OLD.updated_by, NEW.updated_by),
      CASE 
        WHEN NEW.stock_quantity > OLD.stock_quantity THEN 'in'
        ELSE 'out'
      END,
      OLD.stock_quantity,
      NEW.stock_quantity,
      NEW.stock_quantity - OLD.stock_quantity,
      'Stock updated',
      NEW.batch_number
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic stock movement logging
DROP TRIGGER IF EXISTS trigger_log_stock_movement ON products;
CREATE TRIGGER trigger_log_stock_movement
  AFTER UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION log_stock_movement();

-- Insert sample suppliers
INSERT INTO suppliers (name, contact_person, email, phone, address) VALUES
('PharmaCorp Distributors', 'John Smith', 'john@pharmacorp.com', '+63-2-123-4567', '123 Pharma St, Manila, Philippines'),
('MediSupply Inc', 'Maria Garcia', 'maria@medisupply.com', '+63-2-987-6543', '456 Medical Ave, Quezon City, Philippines'),
('HealthCare Distributors', 'Robert Lee', 'robert@healthcare.com', '+63-2-555-0123', '789 Health Blvd, Makati, Philippines')
ON CONFLICT DO NOTHING;

-- Function to get stock movement summary
CREATE OR REPLACE FUNCTION get_stock_movement_summary(
  product_id_param UUID DEFAULT NULL,
  start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  movement_type VARCHAR(20),
  total_quantity INTEGER,
  total_transactions INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sm.movement_type,
    SUM(ABS(sm.quantity_changed))::INTEGER as total_quantity,
    COUNT(*)::INTEGER as total_transactions
  FROM stock_movements sm
  WHERE 
    (product_id_param IS NULL OR sm.product_id = product_id_param)
    AND sm.created_at::DATE BETWEEN start_date AND end_date
  GROUP BY sm.movement_type
  ORDER BY total_quantity DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
