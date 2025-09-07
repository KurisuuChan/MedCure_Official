-- Add inventory alerts tables to support the alert system

-- Alert settings table to store user preferences
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'alert_settings') THEN
        CREATE TABLE alert_settings (
            id integer PRIMARY KEY DEFAULT 1,
            low_stock_threshold integer DEFAULT 10,
            expiry_warning_days integer DEFAULT 30,
            reorder_point integer DEFAULT 5,
            enable_notifications boolean DEFAULT true,
            enable_email_alerts boolean DEFAULT false,
            created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
            updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
        );
        
        -- Insert default settings
        INSERT INTO alert_settings (id) VALUES (1);
        
        RAISE NOTICE 'Created alert_settings table with default values';
    ELSE
        RAISE NOTICE 'alert_settings table already exists';
    END IF;
END $$;

-- Inventory alerts table to store generated alerts
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inventory_alerts') THEN
        CREATE TABLE inventory_alerts (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            alert_id text UNIQUE NOT NULL,
            product_id uuid REFERENCES products(id) ON DELETE CASCADE,
            alert_type text NOT NULL,
            message text NOT NULL,
            severity text NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
            is_read boolean DEFAULT false,
            is_dismissed boolean DEFAULT false,
            metadata jsonb DEFAULT '{}',
            created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
            updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
        );
        
        -- Create indexes for better performance
        CREATE INDEX idx_inventory_alerts_product_id ON inventory_alerts(product_id);
        CREATE INDEX idx_inventory_alerts_alert_type ON inventory_alerts(alert_type);
        CREATE INDEX idx_inventory_alerts_severity ON inventory_alerts(severity);
        CREATE INDEX idx_inventory_alerts_is_read ON inventory_alerts(is_read);
        CREATE INDEX idx_inventory_alerts_created_at ON inventory_alerts(created_at);
        
        RAISE NOTICE 'Created inventory_alerts table with indexes';
    ELSE
        RAISE NOTICE 'inventory_alerts table already exists';
    END IF;
END $$;

-- Alert log table to track alert history and actions
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'alert_log') THEN
        CREATE TABLE alert_log (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            alert_id uuid REFERENCES inventory_alerts(id) ON DELETE CASCADE,
            action text NOT NULL CHECK (action IN ('created', 'read', 'dismissed', 'resolved')),
            user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
            notes text,
            created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
        );
        
        -- Create indexes
        CREATE INDEX idx_alert_log_alert_id ON alert_log(alert_id);
        CREATE INDEX idx_alert_log_action ON alert_log(action);
        CREATE INDEX idx_alert_log_user_id ON alert_log(user_id);
        CREATE INDEX idx_alert_log_created_at ON alert_log(created_at);
        
        RAISE NOTICE 'Created alert_log table with indexes';
    ELSE
        RAISE NOTICE 'alert_log table already exists';
    END IF;
END $$;

-- Function to automatically clean up old alerts
CREATE OR REPLACE FUNCTION cleanup_old_alerts()
RETURNS void AS $$
BEGIN
    -- Delete alerts older than 30 days that are read or dismissed
    DELETE FROM inventory_alerts 
    WHERE created_at < (now() - interval '30 days')
    AND (is_read = true OR is_dismissed = true);
    
    -- Delete orphaned alert logs
    DELETE FROM alert_log 
    WHERE alert_id NOT IN (SELECT id FROM inventory_alerts);
    
    RAISE NOTICE 'Cleaned up old alerts and orphaned logs';
END;
$$ LANGUAGE plpgsql;

-- Function to generate stock level alerts
CREATE OR REPLACE FUNCTION generate_stock_alerts()
RETURNS void AS $$
DECLARE
    settings_rec alert_settings%ROWTYPE;
    product_rec RECORD;
    alert_id_val text;
    days_to_expiry integer;
BEGIN
    -- Get current alert settings
    SELECT * INTO settings_rec FROM alert_settings WHERE id = 1;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Alert settings not found';
    END IF;
    
    -- Skip if notifications are disabled
    IF NOT settings_rec.enable_notifications THEN
        RETURN;
    END IF;
    
    -- Clear existing alerts for fresh generation
    DELETE FROM inventory_alerts WHERE created_at < (now() - interval '1 hour');
    
    -- Process each product
    FOR product_rec IN 
        SELECT id, name, quantity, expiry_date 
        FROM products 
        WHERE active = true
    LOOP
        -- Out of stock alert
        IF product_rec.quantity = 0 THEN
            alert_id_val := 'out_of_stock_' || product_rec.id::text;
            INSERT INTO inventory_alerts (alert_id, product_id, alert_type, message, severity)
            VALUES (
                alert_id_val,
                product_rec.id,
                'out_of_stock',
                product_rec.name || ' is completely out of stock',
                'critical'
            )
            ON CONFLICT (alert_id) DO UPDATE SET
                updated_at = now(),
                is_read = false;
                
        -- Low stock alert
        ELSIF product_rec.quantity <= settings_rec.low_stock_threshold THEN
            alert_id_val := 'low_stock_' || product_rec.id::text;
            INSERT INTO inventory_alerts (alert_id, product_id, alert_type, message, severity)
            VALUES (
                alert_id_val,
                product_rec.id,
                'low_stock',
                product_rec.name || ' is running low (' || product_rec.quantity || ' units remaining)',
                'warning'
            )
            ON CONFLICT (alert_id) DO UPDATE SET
                updated_at = now(),
                is_read = false;
        END IF;
        
        -- Reorder point alert
        IF product_rec.quantity <= settings_rec.reorder_point THEN
            alert_id_val := 'reorder_needed_' || product_rec.id::text;
            INSERT INTO inventory_alerts (alert_id, product_id, alert_type, message, severity)
            VALUES (
                alert_id_val,
                product_rec.id,
                'reorder_needed',
                product_rec.name || ' has reached reorder point (' || product_rec.quantity || ' units)',
                'info'
            )
            ON CONFLICT (alert_id) DO UPDATE SET
                updated_at = now(),
                is_read = false;
        END IF;
        
        -- Expiry alerts
        IF product_rec.expiry_date IS NOT NULL THEN
            days_to_expiry := EXTRACT(DAYS FROM (product_rec.expiry_date - CURRENT_DATE));
            
            IF days_to_expiry < 0 THEN
                -- Expired
                alert_id_val := 'expired_' || product_rec.id::text;
                INSERT INTO inventory_alerts (alert_id, product_id, alert_type, message, severity)
                VALUES (
                    alert_id_val,
                    product_rec.id,
                    'expired',
                    product_rec.name || ' expired ' || ABS(days_to_expiry) || ' days ago',
                    'critical'
                )
                ON CONFLICT (alert_id) DO UPDATE SET
                    updated_at = now(),
                    is_read = false;
                    
            ELSIF days_to_expiry <= settings_rec.expiry_warning_days THEN
                -- Expiring soon
                alert_id_val := 'expiring_soon_' || product_rec.id::text;
                INSERT INTO inventory_alerts (alert_id, product_id, alert_type, message, severity)
                VALUES (
                    alert_id_val,
                    product_rec.id,
                    'expiring_soon',
                    product_rec.name || ' expires in ' || days_to_expiry || ' days',
                    'warning'
                )
                ON CONFLICT (alert_id) DO UPDATE SET
                    updated_at = now(),
                    is_read = false;
            END IF;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Generated stock alerts based on current inventory';
END;
$$ LANGUAGE plpgsql;

-- Function to log alert actions
CREATE OR REPLACE FUNCTION log_alert_action(
    p_alert_id uuid,
    p_action text,
    p_user_id uuid DEFAULT NULL,
    p_notes text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO alert_log (alert_id, action, user_id, notes)
    VALUES (p_alert_id, p_action, p_user_id, p_notes);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to both tables
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_alert_settings_updated_at') THEN
        CREATE TRIGGER update_alert_settings_updated_at
            BEFORE UPDATE ON alert_settings
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created trigger for alert_settings updated_at';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_inventory_alerts_updated_at') THEN
        CREATE TRIGGER update_inventory_alerts_updated_at
            BEFORE UPDATE ON inventory_alerts
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created trigger for inventory_alerts updated_at';
    END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE alert_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for alert_settings (allow all authenticated users)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'alert_settings' AND policyname = 'alert_settings_select_policy') THEN
        CREATE POLICY alert_settings_select_policy ON alert_settings FOR SELECT TO authenticated USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'alert_settings' AND policyname = 'alert_settings_update_policy') THEN
        CREATE POLICY alert_settings_update_policy ON alert_settings FOR UPDATE TO authenticated USING (true);
    END IF;
END $$;

-- Create RLS policies for inventory_alerts (allow all authenticated users)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'inventory_alerts' AND policyname = 'inventory_alerts_select_policy') THEN
        CREATE POLICY inventory_alerts_select_policy ON inventory_alerts FOR SELECT TO authenticated USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'inventory_alerts' AND policyname = 'inventory_alerts_insert_policy') THEN
        CREATE POLICY inventory_alerts_insert_policy ON inventory_alerts FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'inventory_alerts' AND policyname = 'inventory_alerts_update_policy') THEN
        CREATE POLICY inventory_alerts_update_policy ON inventory_alerts FOR UPDATE TO authenticated USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'inventory_alerts' AND policyname = 'inventory_alerts_delete_policy') THEN
        CREATE POLICY inventory_alerts_delete_policy ON inventory_alerts FOR DELETE TO authenticated USING (true);
    END IF;
END $$;

-- Create RLS policies for alert_log (allow all authenticated users)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'alert_log' AND policyname = 'alert_log_select_policy') THEN
        CREATE POLICY alert_log_select_policy ON alert_log FOR SELECT TO authenticated USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'alert_log' AND policyname = 'alert_log_insert_policy') THEN
        CREATE POLICY alert_log_insert_policy ON alert_log FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
END $$;

RAISE NOTICE 'Inventory alerts system setup completed successfully!';
RAISE NOTICE 'Tables created: alert_settings, inventory_alerts, alert_log';
RAISE NOTICE 'Functions created: cleanup_old_alerts(), generate_stock_alerts(), log_alert_action()';
RAISE NOTICE 'RLS policies applied for secure access';
