# 🎯 FIFO BATCH PRICING SYSTEM - HOW IT WORKS

## 📋 Overview
Your pharmacy now uses **FIFO (First In, First Out)** pricing, meaning:
- Product price **always shows the OLDEST batch's price**
- When oldest batch runs out → price **automatically updates** to next oldest
- Each batch can have **different purchase and selling prices**
- System tracks **profit margins** and **COGS** automatically

---

## ✅ How It Works

### 1️⃣ Adding New Stock with Pricing

**Scenario:** You receive medicine from supplier at different prices

#### Example:
```
Initial State:
- Biogesic (Product) = ₱5.00 per piece
- Batch BT110125-001 (Jan 1) = 100 pcs @ ₱5.00 selling

You Restock:
- Add Batch BT110325-001 (Jan 3) = 50 pcs @ ₱7.00 selling
```

**Result:**
- ✅ Product STILL shows ₱5.00 (oldest batch)
- ✅ System knows you have 150 pcs total
- ✅ Batch 001 will sell first (FIFO)

---

### 2️⃣ Auto-Price Update on Batch Depletion

**Scenario:** Customer buys and depletes oldest batch

#### Example:
```
Before Sale:
- Product Price: ₱5.00 (from Batch BT110125-001)
- Batch 001: 100 pcs @ ₱5.00
- Batch 002: 50 pcs @ ₱7.00

Customer Buys: 100 pieces

After Sale:
- ✅ Batch 001: DEPLETED (0 pcs)
- ✅ Product Price: AUTO-UPDATES to ₱7.00 (next oldest)
- ✅ Batch 002: Now the current batch
```

**What Happens:**
1. System sells from oldest batch first (FIFO)
2. Batch 001 quantity becomes 0
3. **Database trigger fires** automatically
4. Product price updates to Batch 002's price (₱7.00)
5. Cashier sees new price immediately in POS

---

## 🔧 Technical Implementation

### Database Trigger (Automatic)
```sql
-- Trigger fires whenever batch quantity changes
CREATE TRIGGER trg_update_price_on_batch_depletion
  AFTER UPDATE ON product_batches
  WHEN (quantity changes OR status changes)
  → Calls update_product_price_from_fifo()
  → Finds oldest active batch
  → Updates product price
```

### Manual Functions (For Troubleshooting)

#### Refresh Single Product
```javascript
import { refreshProductPrice } from '../utils/batchPricingUtils';

// If a product's price looks wrong
await refreshProductPrice(productId);
```

#### Refresh ALL Products
```javascript
import { refreshAllProductPrices } from '../utils/batchPricingUtils';

// Nuclear option - sync all products
const result = await refreshAllProductPrices();
console.log(result.productsUpdated); // Shows count
```

---

## 🎨 UI Components

### BatchPriceRefreshButton
Add to your admin panel:

```jsx
import BatchPriceRefreshButton from './components/admin/BatchPriceRefreshButton';

// In your settings or admin page
<BatchPriceRefreshButton />
```

**When to Use:**
- After bulk imports
- If prices seem "stuck"
- After database maintenance
- As a safety check

---

## 🧪 Testing Scenarios

### Test 1: Basic FIFO Price Display
```
1. Add Batch 1: 100 pcs @ ₱50 selling
2. Add Batch 2: 100 pcs @ ₱80 selling
3. ✅ Check: Product shows ₱50 (oldest)
```

### Test 2: Auto-Update on Depletion
```
1. Start with Batch 1 (₱50) and Batch 2 (₱80)
2. Sell 100 pieces (depletes Batch 1)
3. ✅ Check: Product auto-updates to ₱80
4. Refresh product page to see new price
```

### Test 3: Multiple Batches
```
1. Add Batch 1: ₱40
2. Add Batch 2: ₱50
3. Add Batch 3: ₱60
4. ✅ Product shows ₱40
5. Sell until Batch 1 empty → Price updates to ₱50
6. Sell until Batch 2 empty → Price updates to ₱60
```

### Test 4: Same-Day Multiple Batches
```
1. Add Batch BT110325-001: 50 pcs @ ₱45
2. Add Batch BT110325-002: 30 pcs @ ₱50
   (Same day, sequential number)
3. ✅ Product shows ₱45 (first batch)
```

---

## ⚠️ Common Issues & Solutions

### Issue 1: "Price didn't update after selling"
**Cause:** Batch might not be fully depleted (1-2 pieces remaining)

**Solution:**
- Check batch quantities in database
- Price only updates when batch quantity = 0
- Verify sale was processed correctly

### Issue 2: "Price shows wrong batch"
**Cause:** Database trigger didn't fire or batch dates wrong

**Solution:**
```javascript
// Quick fix - manual refresh
await refreshProductPrice(productId);

// Or refresh all products
await refreshAllProductPrices();
```

### Issue 3: "Multiple batches same price, not updating"
**Cause:** This is correct! If all batches same price, no change needed

**Solution:** No action needed - system working as intended

### Issue 4: "Want to force a price change"
**Cause:** Business decision to override FIFO price

**Solution:**
- Currently system enforces FIFO strictly
- To override: Would need to add "manual price override" feature
- Not recommended (defeats FIFO purpose)

---

## 📊 Reports & Analytics

### Available Data
With FIFO pricing, you can now track:

1. **Cost of Goods Sold (COGS)**
   - How much you paid for items sold
   - Per sale, per day, per month

2. **Gross Profit**
   - Revenue - COGS
   - Tracks actual profit (not just margin)

3. **Profit Margin**
   - Percentage profit per sale
   - Helps identify low-margin items

4. **Batch Performance**
   - Which batches sold faster
   - Expiry risk tracking
   - Supplier comparison

### Sample Query (Supabase Dashboard)
```sql
-- See all batches with their prices
SELECT 
  p.name,
  pb.batch_number,
  pb.quantity,
  pb.purchase_price,
  pb.selling_price,
  pb.markup_percentage,
  pb.created_at
FROM product_batches pb
JOIN products p ON p.id = pb.product_id
WHERE pb.status = 'active'
ORDER BY p.name, pb.created_at ASC;

-- Check current product prices vs oldest batch
SELECT 
  p.name,
  p.price_per_piece as "Current Price",
  (
    SELECT selling_price 
    FROM product_batches 
    WHERE product_id = p.id 
      AND quantity > 0 
      AND status = 'active'
    ORDER BY created_at ASC 
    LIMIT 1
  ) as "Oldest Batch Price"
FROM products p
WHERE p.stock_in_pieces > 0;
```

---

## 🚀 Best Practices

### 1. Always Enter Pricing on Restock
- Don't skip purchase/selling price fields
- Enter accurate supplier costs
- System needs this for COGS tracking

### 2. Monitor Batch Status
- Check batches regularly in inventory
- Watch for expiring batches
- Plan promotions for slow-moving batches

### 3. Verify Price Updates
- After large sales, check product prices
- Use refresh button if unsure
- Report any stuck prices immediately

### 4. Supplier Comparison
- Track which suppliers have better prices
- Compare markup percentages
- Negotiate based on batch data

### 5. Pricing Strategy
- Don't manually edit product prices
- Let system manage FIFO pricing
- Adjust prices in **new batches only**

---

## 📱 User Interface Guide

### Adding Stock (Modal)
```
Product: Biogesic 500mg
Quantity: 100 pieces
Expiry: 2026-12-31

🆕 NEW FIELDS:
├─ Purchase Price: ₱45.00 (what supplier charged)
├─ Selling Price: ₱60.00 (what customer pays)
└─ Markup: 33.33% (auto-calculated)
    ├─ Green: Good margin (>20%)
    ├─ Yellow: Low margin (10-20%)
    └─ Red: Negative margin (selling below cost)
```

### Bulk Import (CSV)
```csv
product_code,quantity,expiry_date,purchase_price,selling_price,supplier,notes
BIO500,100,2026-12-31,45.00,60.00,Generic Co,Monthly restock
PAR500,50,2026-10-15,38.00,55.00,Pharma Inc,Promo batch
```

### Inventory View
```
Biogesic 500mg
├─ Current Price: ₱60.00 ← Shows oldest batch price
├─ Total Stock: 150 pcs
└─ Batches:
    ├─ BT110125-001: 100 pcs @ ₱60.00 ⬅️ OLDEST (displayed)
    └─ BT110325-002: 50 pcs @ ₱65.00 (next)
```

---

## 🔐 Security & Permissions

### Who Can See Pricing?
- **Admin/Owner:** Full pricing visibility
- **Cashier:** See selling price only
- **Inventory Staff:** See both purchase/selling
- **Reports:** COGS visible to admin only

### Audit Trail
- All batch additions logged
- Price changes tracked automatically
- Sale allocations recorded per batch
- Profit calculations stored per transaction

---

## 📞 Support & Troubleshooting

### Quick Diagnostics

**Check if trigger is working:**
```sql
-- In Supabase SQL Editor
SELECT * FROM pg_trigger 
WHERE tgname = 'trg_update_price_on_batch_depletion';
```

**Manual price refresh:**
```sql
SELECT refresh_all_product_prices();
```

**See batch allocation for a sale:**
```sql
SELECT 
  pb.batch_number,
  sba.quantity_sold,
  sba.batch_purchase_price,
  sba.batch_selling_price,
  sba.item_profit
FROM sale_batch_allocations sba
JOIN product_batches pb ON pb.id = sba.batch_id
WHERE sba.sale_id = '<sale_id>';
```

### Need Help?
1. Check this documentation first
2. Use `<BatchPriceRefreshButton />` to sync prices
3. Check Supabase logs for errors
4. Contact dev team with specific batch numbers

---

## 🎓 Summary

### Key Concepts
- ✅ FIFO = First In, First Out (oldest sells first)
- ✅ Product price = Oldest batch's selling price
- ✅ Auto-updates when oldest batch depletes
- ✅ Each batch tracks its own purchase/selling price
- ✅ System calculates COGS and profit automatically

### System Guarantees
- 📌 Price always matches oldest available batch
- 📌 Automatic price updates on batch depletion
- 📌 Batch numbers in format BT110325-001
- 📌 Profit tracking per sale
- 📌 Manual refresh available if needed

### What You Should Do
- 🎯 Always enter purchase/selling prices on restock
- 🎯 Monitor batches regularly
- 🎯 Use refresh button if prices seem wrong
- 🎯 Review profit reports monthly
- 🎯 Plan based on batch expiry dates

---

**Last Updated:** January 2025  
**Version:** 2.0 (Enhanced with auto-triggers)
