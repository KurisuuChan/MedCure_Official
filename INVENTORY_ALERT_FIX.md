# 🔧 Inventory Alert Database Query Fix

## Problem Identified

**Error Message**:

```
invalid input syntax for type integer: "reorder_level"
Failed to check inventory
Code: 22P02
```

**Root Cause**:
The Supabase PostgREST API doesn't support direct column-to-column comparisons in `.or()` filters. The query was trying to compare `stock_in_pieces` to the string `"reorder_level"` instead of comparing it to the actual column value.

## ❌ Original (Broken) Code

```javascript
const { data: products, error } = await supabase
  .from("products")
  .select("id, brand_name, generic_name, stock_in_pieces, reorder_level")
  .or("stock_in_pieces.eq.0,stock_in_pieces.lte.reorder_level") // ❌ This fails!
  .order("stock_in_pieces", { ascending: true })
  .limit(100);
```

**Why it failed**:

- Supabase treats `"reorder_level"` as a string literal, not a column reference
- PostgreSQL receives: `WHERE stock_in_pieces <= 'reorder_level'`
- PostgreSQL expects: `WHERE stock_in_pieces <= reorder_level` (column value)

## ✅ Fixed Code

```javascript
// Fetch all active products - filter in JavaScript
const { data: allProducts, error } = await supabase
  .from("products")
  .select("id, brand_name, generic_name, stock_in_pieces, reorder_level")
  .eq("is_active", true)
  .order("stock_in_pieces", { ascending: true });

if (error) throw error;

if (!allProducts || allProducts.length === 0) {
  showError("No products found in inventory");
  return;
}

// Filter for out of stock and low stock items in JavaScript
const outOfStock = allProducts.filter((p) => p.stock_in_pieces === 0);
const lowStock = allProducts.filter(
  (p) => p.stock_in_pieces > 0 && p.stock_in_pieces <= (p.reorder_level || 10)
);

// Combine problem items
const problemItems = [...outOfStock, ...lowStock];

if (problemItems.length === 0) {
  showSuccess("✅ All products are in good stock!");
  setStockAlert({
    type: "success",
    message: "All inventory levels are healthy",
  });
  return;
}
```

## 🎯 Solution Approach

Instead of trying to compare columns in the database query, we:

1. **Fetch all active products** from the database
2. **Filter in JavaScript** to find:
   - Out of stock items: `stock_in_pieces === 0`
   - Low stock items: `stock_in_pieces > 0 && stock_in_pieces <= reorder_level`
3. **Combine results** into `problemItems` array
4. **Send email** only if there are problem items

## 📊 Performance Considerations

### Concern: "Fetching all products might be slow"

**Answer**: Actually, it's fine because:

- Most pharmacies have 100-5000 products (manageable dataset)
- We're only fetching 5 columns (minimal data transfer)
- Products are already filtered by `is_active = true`
- The data is sorted by `stock_in_pieces` (helps database)
- Client-side filtering is extremely fast for this data size
- Alternative (multiple queries) would be slower due to network latency

### If You Have 10,000+ Products

If your pharmacy grows significantly, you can optimize with:

```javascript
// Option 1: Fetch in chunks
const { data: zeroStock } = await supabase
  .from("products")
  .select("id, brand_name, generic_name, stock_in_pieces, reorder_level")
  .eq("is_active", true)
  .eq("stock_in_pieces", 0);

// Then fetch low stock items with a reasonable limit
const { data: possibleLowStock } = await supabase
  .from("products")
  .select("id, brand_name, generic_name, stock_in_pieces, reorder_level")
  .eq("is_active", true)
  .gt("stock_in_pieces", 0)
  .lte("stock_in_pieces", 50) // Assume max reorder_level is 50
  .limit(500);

// Filter in JavaScript for actual low stock
const lowStock = possibleLowStock.filter(
  (p) => p.stock_in_pieces <= (p.reorder_level || 10)
);
```

```javascript
// Option 2: Use database function (advanced)
// Create a PostgreSQL function that does the comparison
CREATE OR REPLACE FUNCTION get_low_stock_products()
RETURNS TABLE (
  id uuid,
  brand_name text,
  generic_name text,
  stock_in_pieces integer,
  reorder_level integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.brand_name,
    p.generic_name,
    p.stock_in_pieces,
    p.reorder_level
  FROM products p
  WHERE p.is_active = true
    AND (p.stock_in_pieces = 0 OR p.stock_in_pieces <= COALESCE(p.reorder_level, 10))
  ORDER BY p.stock_in_pieces ASC;
END;
$$ LANGUAGE plpgsql;

// Then call it from JavaScript
const { data: problemItems } = await supabase.rpc('get_low_stock_products');
```

## 🧪 Testing

### Test Cases Verified

1. ✅ **All products in good stock**: Shows success message
2. ✅ **Some products out of stock**: Sends email with red table
3. ✅ **Some products low stock**: Sends email with yellow table
4. ✅ **Mixed (out + low stock)**: Sends email with both tables
5. ✅ **No products in database**: Shows error message
6. ✅ **Database error**: Catches and shows error

### How to Test

1. Open System Settings → Notifications → Inventory Alerts
2. Click "Check Inventory & Send Alert"
3. Check browser console for query details
4. Verify email is sent to configured address
5. Check email for proper formatting

## 📧 Email Output Example

When alert is sent, the email includes:

```
🏥 MedCure Pharmacy
Inventory Alert Report

Alert Summary
Generated: Oct 14, 2025 10:30 AM
Total Items Requiring Attention: 8

🚨 OUT OF STOCK (3 items)
┌────────────────────┬──────────┬─────────────────┐
│ Product            │  Stock   │ Reorder Level   │
├────────────────────┼──────────┼─────────────────┤
│ Paracetamol 500mg  │    0     │       10        │
│ Amoxicillin 250mg  │    0     │       20        │
│ Ibuprofen 400mg    │    0     │       15        │
└────────────────────┴──────────┴─────────────────┘

⚠️ LOW STOCK (5 items)
┌────────────────────┬──────────┬─────────────────┐
│ Product            │  Stock   │ Reorder Level   │
├────────────────────┼──────────┼─────────────────┤
│ Aspirin 100mg      │    5     │       10        │
│ Vitamin C 500mg    │    8     │       20        │
│ Omeprazole 20mg    │    3     │       15        │
│ Cetirizine 10mg    │    7     │       25        │
│ Metformin 500mg    │    4     │       30        │
└────────────────────┴──────────┴─────────────────┘

📋 Action Required:
Please review these items and place orders as needed
to maintain optimal inventory levels.
```

## 🔍 Database Schema Reference

### Products Table Columns Used

```sql
products (
  id uuid PRIMARY KEY,
  brand_name text,
  generic_name text,
  stock_in_pieces integer,
  reorder_level integer,
  is_active boolean DEFAULT true
)
```

### Key Points

- `stock_in_pieces`: Current inventory quantity (integer)
- `reorder_level`: Threshold for low stock alerts (integer)
- `is_active`: Whether product is active (boolean)

## 📝 Code Changes Summary

**File**: `src/components/settings/NotificationManagement.jsx`

**Line ~103-106**: Changed query approach

- Before: `.or("stock_in_pieces.eq.0,stock_in_pieces.lte.reorder_level")` ❌
- After: Fetch all, filter in JavaScript ✅

**Line ~120-126**: Added client-side filtering

- `outOfStock`: Items with 0 stock
- `lowStock`: Items with stock > 0 and <= reorder_level
- `problemItems`: Combined array

**Line ~150**: Updated variable reference

- Changed: `products.length` → `problemItems.length`

**Line ~261**: Updated variable reference

- Changed: `total: products.length` → `total: problemItems.length`

## ✅ Status

- [x] Database query syntax error fixed
- [x] Client-side filtering implemented
- [x] Email alert system working
- [x] All variable references updated
- [x] Error handling improved
- [x] Success messages added
- [x] Code tested and verified

## 🎉 Result

The inventory alert system now works perfectly! It:

- ✅ Queries the database correctly
- ✅ Filters products accurately
- ✅ Sends professional HTML emails
- ✅ Shows clear status feedback
- ✅ Handles edge cases gracefully

---

**Fixed**: October 14, 2025  
**Component**: NotificationManagement.jsx  
**Issue**: Supabase column-to-column comparison in .or() filter  
**Solution**: Fetch all active products, filter in JavaScript
