# 🚀 FIFO Batch-Based Pricing System - Setup Guide

## 📋 What You're Getting

Your MedCure pharmacy system will now support **batch-specific pricing** with automatic **FIFO (First In, First Out)** inventory management and **profit tracking**.

### Key Features:
- ✅ Each batch has its own purchase price and selling price
- ✅ System automatically sells from oldest batch first (FIFO)
- ✅ Current batch price is displayed to cashier (updates when batch depletes)
- ✅ Automatic Cost of Goods Sold (COGS) calculation
- ✅ Real-time profit margin tracking
- ✅ Historical batch allocation records

---

## 🔧 Installation Steps

### **Step 1: Run the Database Migration**

You need to run the SQL migration file to add the new features to your Supabase database.

#### **Option A: Using Supabase Dashboard** (Recommended)

1. Open your browser and go to: https://supabase.com/dashboard
2. Select your **MedCure_Official** project
3. Click **SQL Editor** in the left sidebar
4. Click **+ New query**
5. Copy the entire contents of: `supabase/migrations/20250101_fifo_batch_pricing.sql`
6. Paste it into the SQL editor
7. Click **Run** button (or press `Ctrl+Enter`)
8. You should see: ✅ "Success. No rows returned"

#### **Option B: Using Supabase CLI** (If you have CLI installed)

```powershell
# Navigate to your project
cd "C:\Users\cleme\OneDrive\Documents\med\MedCure_Official"

# Apply the migration
supabase db push
```

### **Step 2: Verify Migration Success**

Run this test query in Supabase SQL Editor:

```sql
-- Check if new columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'product_batches' 
  AND column_name IN ('purchase_price', 'selling_price', 'markup_percentage');

-- Should return 3 rows showing these columns exist
```

Expected output:
```
column_name         | data_type
--------------------|----------
purchase_price      | numeric
selling_price       | numeric
markup_percentage   | numeric
```

### **Step 3: Test the FIFO Functions**

```sql
-- Test get_current_batch_price for any product
SELECT * FROM get_current_batch_price(
  (SELECT id FROM products LIMIT 1)
);

-- Should return the oldest active batch with its prices
```

---

## 📊 How It Works

### **Adding a New Batch (With Prices)**

**Before:**
```javascript
{
  productId: "abc-123",
  quantity: 100,
  expiryDate: "2026-12-31"
}
```

**Now:**
```javascript
{
  productId: "abc-123",
  quantity: 100,
  expiryDate: "2026-12-31",
  purchase_price: 50,    // What you paid supplier (₱50 per unit)
  selling_price: 80,     // What you charge customer (₱80 per unit)
  supplier_name: "PharmaCorp",
  notes: "Batch #12345"
}
```

The system automatically calculates:
- **Markup:** `(80 - 50) / 50 * 100 = 60%`

### **Selling with FIFO (Automatic)**

**Scenario:**
- **Batch 1:** 100 units @ ₱50 cost, ₱80 selling (added first)
- **Batch 2:** 200 units @ ₱60 cost, ₱90 selling (added later)
- **Customer buys:** 150 units

**System automatically:**
1. Takes 100 units from Batch 1 (oldest)
2. Takes 50 units from Batch 2 (next oldest)
3. Calculates:
   - **COGS:** `(100 × ₱50) + (50 × ₱60) = ₱8,000`
   - **Revenue:** `(100 × ₱80) + (50 × ₱90) = ₱12,500`
   - **Profit:** `₱12,500 - ₱8,000 = ₱4,500`
   - **Margin:** `(₱4,500 / ₱12,500) × 100 = 36%`

### **What Cashier Sees**

When cashier selects a product in POS:
- **Current Price:** ₱80 (from Batch 1 - oldest available)
- When Batch 1 is depleted → price auto-updates to ₱90 (Batch 2)

---

## 🎯 Next Steps (Code Updates)

I'll now update your application code to use this new system:

### **1. Bulk Batch Import Modal** ✏️
- Add "Purchase Price" input field
- Add "Selling Price" input field
- Calculate and display markup percentage
- Update CSV template to include pricing columns

### **2. POS System** 🛒
- Fetch current batch price when product selected
- Display price from oldest available batch
- Auto-refresh price when batch depletes
- Show profit margin on receipts (optional)

### **3. Sales Service** 💰
- Use `process_fifo_sale()` stored procedure
- Track batch allocations
- Calculate COGS automatically
- Store profit data with each sale

### **4. Reports & Analytics** 📈
- Add COGS column to sales reports
- Show gross profit per sale
- Display profit margins
- Trending profitability charts

---

## 🔍 Testing Checklist

After I update the code, test these scenarios:

### **Test 1: Add Batch with Prices**
1. Go to **Inventory** → **Batch Management**
2. Click **Add New Batch**
3. Enter: Quantity, Expiry Date, **Purchase Price**, **Selling Price**
4. ✅ Verify batch saved with prices

### **Test 2: FIFO Sales**
1. Add 2 batches of same product with different prices
2. Make a sale that exceeds first batch quantity
3. Check `sale_batch_allocations` table
4. ✅ Verify both batches were used (oldest first)

### **Test 3: Price Updates**
1. Completely deplete first batch
2. Check POS price display
3. ✅ Verify price updated to second batch's selling price

### **Test 4: Profit Tracking**
1. Make a sale
2. Check sales table for `total_cogs`, `gross_profit`, `profit_margin_percentage`
3. ✅ Verify accurate calculations

---

## 📖 Database Schema Reference

### **New Columns in `product_batches`**
| Column | Type | Description |
|--------|------|-------------|
| `purchase_price` | NUMERIC | Cost per unit from supplier |
| `selling_price` | NUMERIC | Price per unit to customer |
| `markup_percentage` | NUMERIC | Auto-calculated markup % |

### **New Columns in `sales`**
| Column | Type | Description |
|--------|------|-------------|
| `total_cogs` | NUMERIC | Total cost of goods sold |
| `gross_profit` | NUMERIC | Revenue - COGS |
| `profit_margin_percentage` | NUMERIC | (Profit / Revenue) × 100 |

### **New Table: `sale_batch_allocations`**
Tracks which batches were used for each sale item.

| Column | Description |
|--------|-------------|
| `sale_id` | Link to sale |
| `batch_id` | Which batch was used |
| `quantity_sold` | How many units from this batch |
| `batch_purchase_price` | Cost price at time of sale |
| `batch_selling_price` | Selling price at time of sale |
| `item_cogs` | quantity × purchase_price |
| `item_revenue` | quantity × selling_price |
| `item_profit` | revenue - cogs |

---

## 🔒 Backward Compatibility

**Existing batches without prices:**
- System automatically fills `selling_price` from `products.price_per_piece`
- System uses `cost_per_unit` as `purchase_price`
- No data loss, everything continues working!

---

## ❓ FAQ

### Q: What if I don't know the purchase price?
**A:** You can leave it as ₱0. The system will work, but profit calculations will be inaccurate.

### Q: Can I change prices after adding a batch?
**A:** Yes! Update the batch record directly. Future sales will use the new price. Past sales remain unchanged.

### Q: What if two batches have the same price?
**A:** System still follows FIFO by creation date (oldest first).

### Q: Do I need to manually track FIFO?
**A:** NO! The system does it automatically. Just add batches, make sales, and check your profits!

---

## 🎉 Ready to Proceed?

**Please confirm:**
1. ✅ I've run the SQL migration in Supabase
2. ✅ I've verified the new columns exist
3. ✅ I'm ready for code updates

**Reply with:** "Migration complete, update the code!" and I'll proceed with updating your React components! 🚀
