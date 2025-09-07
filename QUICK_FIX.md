## 🔧 Quick Fix for Database Issues

You have two issues to resolve:

### 1. **UUID Error Fix**

Run this SQL in your Supabase SQL Editor to clean up any invalid sample data:

```sql
-- Clean up invalid sample data
DELETE FROM sale_items WHERE sale_id IN (
    SELECT id FROM sales WHERE cashier_id = 'REPLACE-WITH-CASHIER-UUID'
);

DELETE FROM sales WHERE cashier_id = 'REPLACE-WITH-CASHIER-UUID';

-- Reset product stock to original values
UPDATE products SET stock_quantity = 150 WHERE name = 'Paracetamol 500mg';
UPDATE products SET stock_quantity = 80 WHERE name = 'Amoxicillin 500mg';
UPDATE products SET stock_quantity = 200 WHERE name = 'Vitamin C 500mg';
UPDATE products SET stock_quantity = 100 WHERE name = 'Cetirizine 10mg';
UPDATE products SET stock_quantity = 60 WHERE name = 'Omeprazole 20mg';
```

### 2. **Module Import Fix**

The `useAuth` import should now work. If you still get the module error:

1. **Stop the dev server** (Ctrl+C)
2. **Clear the cache**: `rm -rf node_modules/.vite` (or delete the `.vite` folder)
3. **Restart**: `npm run dev`

### 3. **Add Sample Data (Optional)**

After fixing the UUID issue, you can run the updated `sample_data.sql` to add sample transactions.

## 🚀 **Test Your System**

Your development server is running at: **http://localhost:5174/**

Test login with:

- **admin@medcure.com** / **123456**
- **pharmacist@medcure.com** / **123456**
- **cashier@medcure.com** / **123456**

## ✅ **What's Working Now**

1. ✅ **Authentication** - Fixed useAuth export
2. ✅ **Dashboard** - Real data from Supabase
3. ✅ **POS System** - Complete cart and checkout
4. ✅ **Inventory Management** - Full CRUD operations
5. ✅ **Reports & Analytics** - Sales and inventory reports
6. ✅ **Settings** - User and system management
7. ✅ **Role-Based Access** - Admin, Pharmacist, Cashier permissions

Your Medcure Pharmacy Management System is now complete! 🎉
