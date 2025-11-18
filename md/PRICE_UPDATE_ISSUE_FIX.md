# 🔧 Price Update Issue - Product Disappearing After Update

## Problem Description
When updating a product's price in the inventory, the product disappears from the list and only reappears after a page reload.

## Root Cause Analysis

After analyzing the codebase, I've identified the likely issue:

### Issue #1: State Update in `useInventory.js`
```javascript
// Current code (line 409-416 in useInventory.js)
const updateProduct = async (id, productData) => {
  setIsLoading(true);
  try {
    const updatedProduct = await inventoryService.updateProduct(id, productData);
    setProducts((prev) =>
      prev.map((product) => (product.id === id ? updatedProduct : product))
    );
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  } finally {
    setIsLoading(false);
  }
};
```

**Problem**: The state update replaces the product, but if `updatedProduct` has a different structure or missing fields, it could cause filtering issues that hide the product.

### Issue #2: Filtering Logic May Hide Product
The `filteredProducts` memo in `useInventory.js` has extensive filtering logic that might temporarily hide a product if:
- The product becomes `is_archived: true` somehow
- The product's fields don't match current filters
- A race condition where old state is used during filtering

### Issue #3: No Explicit Reload After Update
In `InventoryPage.jsx` (lines 387-404), the edit modal's `onSave` does NOT call `loadProducts()`:

```javascript
onSave={async (productData) => {
  try {
    await updateProduct(selectedProduct.id, productData);
    setShowEditModal(false);
    setSelectedProduct(null);
    // ❌ MISSING: await loadProducts();
    showSuccess(...);
  } catch (error) {
    showError(...);
  }
}}
```

Compare this to the Add Product flow (lines 347-372), which DOES reload:
```javascript
await addProduct(productData);
setShowAddModal(false);
await loadProducts(); // ✅ This is present
```

## Solution

### Fix #1: Add Explicit Reload After Update (Recommended)
Update `InventoryPage.jsx` to reload products after successful update:

```javascript
onSave={async (productData) => {
  try {
    await updateProduct(selectedProduct.id, productData);
    setShowEditModal(false);
    setSelectedProduct(null);
    
    // ✅ ADD THIS LINE
    await loadProducts();
    
    showSuccess(...);
  } catch (error) {
    showError(...);
  }
}}
```

### Fix #2: Improve State Update (Alternative)
Modify `useInventory.js` to ensure the updated product maintains all required fields:

```javascript
const updateProduct = async (id, productData) => {
  setIsLoading(true);
  try {
    const updatedProduct = await inventoryService.updateProduct(id, productData);
    
    // ✅ Enhanced: Merge with existing product to preserve all fields
    setProducts((prev) =>
      prev.map((product) => 
        product.id === id 
          ? { ...product, ...updatedProduct } // Merge instead of replace
          : product
      )
    );
    
    // ✅ Optional: Force a fresh fetch to be 100% sure
    // await loadProducts();
    
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  } finally {
    setIsLoading(false);
  }
};
```

### Fix #3: Add Debug Logging
Add logging to understand what's happening:

```javascript
const updateProduct = async (id, productData) => {
  setIsLoading(true);
  try {
    console.log('🔄 Updating product:', { id, productData });
    
    const updatedProduct = await inventoryService.updateProduct(id, productData);
    
    console.log('✅ Update response:', updatedProduct);
    console.log('📊 Product fields:', {
      is_archived: updatedProduct.is_archived,
      is_active: updatedProduct.is_active,
      price_per_piece: updatedProduct.price_per_piece,
      stock_in_pieces: updatedProduct.stock_in_pieces
    });
    
    setProducts((prev) => {
      const updated = prev.map((product) => 
        product.id === id ? updatedProduct : product
      );
      console.log('📦 Products after update:', updated.length);
      return updated;
    });
    
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  } finally {
    setIsLoading(false);
  }
};
```

## Testing Steps

1. **Run Diagnostic Script**:
   ```bash
   node test-price-update.js
   ```

2. **Test in UI**:
   - Open browser DevTools Console
   - Update a product's price
   - Watch for console logs
   - Check if product disappears
   - Check Network tab for API calls

3. **Verify Database**:
   - Check Supabase dashboard
   - Verify price was actually updated
   - Confirm `is_archived` is still `false`

## Implementation Priority

**Immediate Fix (Do this now)**:
- Apply Fix #1: Add `await loadProducts()` after update in `InventoryPage.jsx`

**Secondary Improvements**:
- Apply Fix #2: Improve state merging in `useInventory.js`
- Apply Fix #3: Add debug logging for troubleshooting

## Expected Outcome

After applying Fix #1, when you update a product's price:
1. ✅ Price updates in database
2. ✅ Product list reloads with fresh data
3. ✅ Updated product remains visible
4. ✅ No need to manually reload page
