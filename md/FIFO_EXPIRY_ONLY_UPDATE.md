# 🔄 FIFO System Update - Expiry-Based Only

**Date:** November 11, 2025  
**Status:** ✅ Implemented  
**Migration File:** `20250111_remove_fifo_pricing.sql`

---

## 📋 Summary of Changes

The MedCure system has been updated to **remove automatic FIFO-based pricing** while **retaining FIFO logic for expiry date management**. This change gives you full control over product pricing while maintaining smart inventory rotation based on expiration dates.

---

## 🎯 What Changed

### ✅ **BEFORE (Old System)**
- Product prices automatically updated based on oldest batch price
- When you added a new batch with different price, product price changed
- When oldest batch depleted, price updated to next oldest batch
- Complex price management, difficult to maintain consistent pricing

### ✅ **AFTER (New System)**
- Product prices are **manually managed** in the products table
- Batch prices are stored for **cost tracking and profit calculation only**
- FIFO logic **still applies** but only for selecting which batches to use first (by expiry date)
- Simple, predictable pricing that you control

---

## 🔧 How It Works Now

### **Pricing**
1. **Product Price** = Set in `products.price_per_piece` (manual control)
2. **Batch Prices** = Stored in `product_batches` (for COGS tracking)
3. **Sales Use** = Product price for revenue calculation
4. **Profit Calculation** = Product price - Batch COGS

### **FIFO Selection (Expiry-Based)**
When a sale occurs:
1. System finds all active batches for the product
2. Sorts by **expiry date** (earliest first)
3. Then by **creation date** (oldest first)
4. Deducts quantity from batches in that order
5. Ensures products expiring soonest are sold first

### **Example Scenario**

You have Amoxicillin in stock:
- **Product Price:** ₱50 (set manually)
- **Batch A:** 100 pcs, expires 2025-12-01, cost ₱30
- **Batch B:** 100 pcs, expires 2025-12-15, cost ₱35

**Customer buys 150 pcs:**
1. System deducts 100 from Batch A (expiring Dec 1)
2. System deducts 50 from Batch B (expiring Dec 15)
3. Revenue: 150 × ₱50 = ₱7,500
4. COGS: (100 × ₱30) + (50 × ₱35) = ₱4,750
5. Profit: ₱7,500 - ₱4,750 = ₱2,750

**Important:** Product price stays ₱50 regardless of batch costs!

---

## 📊 Database Changes

### **Modified Functions**

#### 1. `update_product_price_from_fifo()`
```sql
-- OLD: Updated product price to match oldest batch
-- NEW: Does nothing (kept for compatibility)
```

#### 2. `add_product_batch()`
```sql
-- OLD: Added batch + updated product price
-- NEW: Adds batch + keeps product price unchanged
```

#### 3. `process_fifo_sale()`
```sql
-- OLD: Used oldest batch price for revenue calculation
-- NEW: Uses product.price_per_piece for revenue calculation
-- KEPT: FIFO selection by expiry date
```

#### 4. `trigger_update_product_price_on_batch_change()`
```sql
-- OLD: Auto-updated price when batch depleted
-- NEW: Does nothing (kept for compatibility)
```

---

## 🚀 Migration Instructions

### **Step 1: Backup Your Database**
```bash
# Create backup before running migration
pg_dump your_database > backup_before_fifo_pricing_removal.sql
```

### **Step 2: Run the Migration**

**Option A: Via Supabase Dashboard**
1. Go to Supabase Dashboard → SQL Editor
2. Open `supabase/migrations/20250111_remove_fifo_pricing.sql`
3. Copy and paste the entire contents
4. Click "Run"
5. Verify you see the success message

**Option B: Via Supabase CLI**
```bash
supabase db push
```

### **Step 3: Verify Migration**

Run this query to confirm:
```sql
-- Check if functions are updated
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_name IN (
  'update_product_price_from_fifo',
  'add_product_batch',
  'process_fifo_sale'
)
ORDER BY routine_name;
```

---

## 💰 Managing Product Prices

### **Setting Prices**

**Via UI (Recommended):**
1. Go to Inventory Management
2. Edit product
3. Update "Selling Price" field
4. Save changes

**Via SQL:**
```sql
UPDATE products
SET 
  price_per_piece = 150.00,
  updated_at = NOW()
WHERE id = 'your-product-id';
```

### **Batch Prices**

When adding batches, you can still enter purchase and selling prices:
- **Purchase Price** = Used for COGS calculation
- **Selling Price** = Stored for reference only (not used for sales)
- **Product Price** = Actually used for sales

---

## 📈 Profit Tracking Still Works!

Even though prices are managed separately, profit calculations remain accurate:

### **Sale Reports Include:**
- **Revenue** = Quantity × Product Price
- **COGS** = Sum of (Batch Quantity × Batch Purchase Price)
- **Gross Profit** = Revenue - COGS
- **Profit Margin %** = (Gross Profit / Revenue) × 100

### **Example Report:**
```
Sale #12345
-----------
Product: Amoxicillin 500mg
Quantity Sold: 200 pcs
Product Price: ₱50/pc
Revenue: ₱10,000

Batch Allocations:
- Batch A (exp 12/01): 100 pcs @ ₱30 = ₱3,000 COGS
- Batch B (exp 12/15): 100 pcs @ ₱35 = ₱3,500 COGS

Total COGS: ₱6,500
Gross Profit: ₱3,500
Margin: 35%
```

---

## ⚠️ Important Notes

### **What You Need to Do:**
1. ✅ **Run the migration** (required)
2. ✅ **Review product prices** - ensure they're set correctly
3. ✅ **Update pricing strategy** - decide on your pricing rules
4. ✅ **Train staff** - explain new pricing workflow

### **What Stays the Same:**
- ✅ Batch tracking and management
- ✅ Expiry date tracking
- ✅ FIFO batch selection (by expiry)
- ✅ Stock level calculations
- ✅ Sales processing
- ✅ Profit and COGS tracking

### **What No Longer Works:**
- ❌ Automatic price updates when adding batches
- ❌ Automatic price updates when batches deplete
- ❌ Price syncing with oldest batch
- ❌ `refresh_all_product_prices()` function

---

## 🔍 Testing the Changes

### **Test 1: Add Batch Without Price Change**

```sql
-- Add a batch with different price
SELECT add_product_batch(
  p_product_id := 'your-product-id',
  p_quantity := 100,
  p_expiry_date := '2025-12-31',
  p_purchase_price := 99.99,
  p_selling_price := 199.99
);

-- Check product price (should be unchanged)
SELECT 
  brand_name,
  price_per_piece as "Current Product Price",
  stock_in_pieces
FROM products
WHERE id = 'your-product-id';
```

### **Test 2: FIFO by Expiry Date**

```sql
-- Check batch order (should be by expiry date)
SELECT 
  batch_number,
  quantity,
  expiry_date,
  created_at,
  CASE 
    WHEN expiry_date IS NULL THEN 9999
    ELSE EXTRACT(DAYS FROM expiry_date - CURRENT_DATE)::INTEGER
  END as "Days Until Expiry"
FROM product_batches
WHERE product_id = 'your-product-id'
  AND quantity > 0
  AND status = 'active'
ORDER BY 
  COALESCE(expiry_date, '9999-12-31'::date) ASC,
  created_at ASC;
```

### **Test 3: Sale Processing**

```sql
-- Process a sale
SELECT process_fifo_sale(
  '{"user_id": "your-user-id", "total_amount": 1000, "payment_method": "cash"}'::json,
  '[{"product_id": "your-product-id", "quantity": 50, "unit_type": "pieces", "unit_price": 50, "total_price": 2500}]'::json
);

-- Check which batch was used (should be earliest expiry)
SELECT 
  pb.batch_number,
  pb.expiry_date,
  sba.quantity_sold,
  sba.batch_purchase_price as "Batch Cost",
  sba.batch_selling_price as "Product Price Used",
  sba.item_profit
FROM sale_batch_allocations sba
JOIN product_batches pb ON pb.id = sba.batch_id
ORDER BY sba.created_at DESC
LIMIT 10;
```

---

## 🆘 Troubleshooting

### **Issue: Old prices still showing**
**Solution:** Prices are now managed manually. Update them in the products table.

### **Issue: FIFO not working**
**Check:** FIFO still works for batch selection, just not for pricing.
```sql
-- Verify FIFO order
SELECT * FROM product_batches 
WHERE product_id = 'your-id' 
ORDER BY expiry_date ASC, created_at ASC;
```

### **Issue: Profit calculations wrong**
**Check:** Ensure batch purchase prices are set correctly.
```sql
SELECT 
  batch_number,
  purchase_price,
  selling_price
FROM product_batches
WHERE purchase_price IS NULL OR purchase_price = 0;
```

---

## 📚 Related Documentation

- [Batch Management Guide](./FIFO_BATCH_PRICING_USER_GUIDE.md) - Still relevant for expiry-based FIFO
- [Export Functionality](./EXPORT_AUDIT_AND_FIXES.md) - Updated export logic
- [Pricing Strategy](./PRICING_STRATEGY.md) - How to manage prices effectively

---

## ✅ Verification Checklist

Before considering migration complete:

- [ ] Migration ran successfully
- [ ] No errors in Supabase logs
- [ ] Product prices reviewed and set correctly
- [ ] Test batch addition (price stays same)
- [ ] Test sale processing (FIFO by expiry works)
- [ ] Test profit calculations (COGS tracked correctly)
- [ ] Staff trained on new pricing workflow
- [ ] Old documentation updated/removed

---

## 🎉 Benefits of This Change

1. **Predictable Pricing** - You control prices, not automatic systems
2. **Simplified Management** - One price per product, easy to understand
3. **Still Smart FIFO** - Products expiring soon are still sold first
4. **Accurate Profit Tracking** - COGS calculated from actual batch costs
5. **Flexible Pricing Strategy** - Price independently from purchase costs
6. **Reduced Confusion** - No more "why did my price change?" questions

---

**Questions or Issues?** Check the troubleshooting section or review migration logs.

**End of Documentation**
