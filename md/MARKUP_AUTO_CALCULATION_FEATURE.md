# Markup Auto-Calculation Feature

## Overview
Implemented automatic markup calculation for batch management and bulk import workflows. Users can now enter a markup percentage which automatically calculates the unit price based on the purchase price.

## Implementation Date
November 13, 2024

## Features Implemented

### 1. AddStockModal (Batch Management)
- **Location**: `src/components/modals/AddStockModal.jsx`
- **Layout**: Changed from 2-column to 3-column pricing grid
  - Column 1: Purchase Price ₱ (cost from supplier)
  - Column 2: Markup % (new editable field)
  - Column 3: Unit Price ₱ (price to customer)

#### Auto-Calculation Logic
```javascript
// When Purchase Price changes:
if (markup > 0) {
  unitPrice = purchasePrice × (1 + markup/100)
}

// When Markup % changes:
if (purchasePrice > 0) {
  unitPrice = purchasePrice × (1 + markup/100)
}
```

#### Visual Features
- Markup field has blue background and Percent icon
- Help text: "Auto-calculates price"
- Unit Price can still be manually overridden
- Calculated markup display shows percentage with color coding:
  - Red: Negative margin (selling below cost)
  - Yellow: 0% or low markup (<20%)
  - Green: Good markup (≥20%)

### 2. BulkBatchImportModal (Bulk Import)
- **Location**: `src/components/modals/BulkBatchImportModal.jsx`
- **Table Headers Updated**:
  - Changed "Selling ₱" to "Unit Price ₱"
  - Added "Markup %" column between Purchase and Unit Price
  
#### Column Order
1. Generic Name
2. Current Stock
3. Status
4. Quantity * (required)
5. Purchase ₱
6. **Markup %** (new - blue highlighted)
7. Unit Price ₱
8. Expiry Date * (required)
9. Actions

#### Auto-Calculation Features
- Markup field has blue background for visibility
- Auto-calculates unit price when:
  - Purchase price is entered and markup is changed
  - Markup is entered and purchase price exists
- Manual override still available on unit price field
- Negative margin warning with red border if unit < purchase

### 3. Data Structure Updates
Both modals now include `markupPercentage` field in their data structures:
```javascript
{
  purchasePrice: "",
  markupPercentage: "",  // New field
  sellingPrice: "",
  // ... other fields
}
```

## User Experience

### Workflow Examples

#### Example 1: Adding Stock with Markup
1. Open Add Stock modal for a product
2. Enter Quantity: 100
3. Enter Purchase Price: ₱45.00
4. Enter Markup %: 11.1
5. **Unit Price auto-fills**: ₱50.00
6. System shows: "Calculated Markup: 11.1%" in green
7. Enter Expiry Date and submit

#### Example 2: Bulk Import with Auto-Calc
1. Open Bulk Import modal
2. For each low-stock item:
   - Enter quantity
   - Enter purchase price: ₱100.00
   - Enter markup: 25
   - **Unit price auto-fills**: ₱125.00
3. Review all items and submit batch

#### Example 3: Manual Override
1. Enter Purchase Price: ₱45.00
2. Enter Markup %: 11.1
3. Unit Price auto-calculates to: ₱50.00
4. Manually change Unit Price to: ₱52.00
5. System recalculates and shows: "Calculated Markup: 15.6%"

## Technical Details

### Icons Used
- **DollarSign**: Purchase Price field
- **Percent**: Markup % field (new)
- **TrendingUp**: Unit Price field

### Validation
- Negative margin detection (unit < purchase)
- Visual warning with red border
- Alert icon with message: "Warning: Negative margin (selling below cost)"
- Color-coded markup display for quick assessment

### Calculation Formula
```
Unit Price = Purchase Price × (1 + Markup% ÷ 100)

Example:
Purchase Price = ₱45.00
Markup % = 11.1
Unit Price = 45 × (1 + 11.1/100)
          = 45 × 1.111
          = ₱50.00
```

### Reverse Calculation
When unit price is manually entered, the system displays the actual markup:
```
Markup % = ((Unit Price - Purchase Price) ÷ Purchase Price) × 100

Example:
Purchase Price = ₱45.00
Unit Price = ₱50.00
Markup % = ((50 - 45) ÷ 45) × 100
         = (5 ÷ 45) × 100
         = 11.1%
```

## Benefits

### For Users
1. **Faster Data Entry**: No need to manually calculate unit prices
2. **Consistency**: Ensures markup is applied correctly
3. **Flexibility**: Can still override auto-calculated values
4. **Visual Feedback**: Immediate markup percentage display
5. **Error Prevention**: Negative margin warnings

### For Business
1. **Standardized Pricing**: Encourages consistent markup across products
2. **Profit Visibility**: Clear view of margins during stock addition
3. **Efficiency**: Reduces time spent on batch operations
4. **Accuracy**: Eliminates calculation errors

## Usage Instructions

### AddStockModal
1. Select a product from inventory
2. Click "Add Stock" button
3. Enter batch quantity
4. Enter purchase price from supplier
5. Enter desired markup percentage
6. Unit price automatically calculates
7. Review calculated markup display
8. Enter expiry date
9. Click "Add Stock" to save

### BulkBatchImportModal
1. Click "Bulk Import" button
2. Review low-stock items table
3. For each item:
   - Enter quantity to add
   - Enter purchase price
   - Enter markup %
   - Unit price auto-fills
4. Optional: Use "Previous Prices" button
5. Verify all required fields are filled
6. Click "Import All Batches"

## Files Modified

### 1. AddStockModal.jsx
**Changes:**
- Added `Percent` icon import from lucide-react
- Added `markupPercentage` to formData state
- Changed pricing grid from 2 columns to 3 columns
- Added Markup % input field with onChange handler
- Updated Purchase Price onChange to trigger auto-calculation
- Modified markup display to show "Calculated Markup"
- Enhanced labels and help text

**Lines Modified:** ~100 lines affected

### 2. BulkBatchImportModal.jsx
**Changes:**
- Added `markupPercentage` to item data structure
- Updated table headers (7 columns total)
- Added Markup % column between Purchase and Unit Price
- Changed "Selling ₱" to "Unit Price ₱"
- Added auto-calculation onChange handlers
- Updated instruction text
- Applied blue background styling to markup inputs

**Lines Modified:** ~50 lines affected

## Testing Recommendations

### Test Cases
1. ✅ Enter markup % first, then purchase price
2. ✅ Enter purchase price first, then markup %
3. ✅ Change markup % after auto-calculation
4. ✅ Manually override unit price
5. ✅ Test with 0% markup
6. ✅ Test with negative margins
7. ✅ Test bulk import with multiple items
8. ✅ Test "Use Previous Prices" button behavior
9. ✅ Verify markup display calculations
10. ✅ Test edge cases (very high/low values)

### Edge Cases to Verify
- Purchase price = 0
- Markup = 0
- Very high markup (>1000%)
- Decimal markup values (e.g., 11.11%)
- Manual unit price entry (should show actual markup)

## Future Enhancements

### Potential Improvements
1. **Preset Markups**: Add quick buttons (10%, 15%, 20%, 25%)
2. **Product-Level Defaults**: Save preferred markup per product category
3. **Bulk Apply Markup**: Apply same markup % to all items in bulk import
4. **Margin Warnings**: Configurable thresholds for low-margin alerts
5. **Historical Markup Analysis**: Track markup trends over time
6. **Category-Based Markup**: Suggest markup based on product category
7. **Profit Calculator**: Show estimated profit per unit

### Settings Integration
Consider adding to Business Settings:
- Default markup percentage
- Minimum acceptable markup
- Category-specific markup rules
- Warning thresholds

## Notes

### Design Decisions
1. **Editable Markup Field**: Chosen over dropdown for maximum flexibility
2. **Auto-Fill but Overridable**: Respects user's manual changes
3. **Blue Highlighting**: Makes the new field visually distinct
4. **Display Calculated Markup**: Shows actual margin even after manual edits
5. **Column Reordering**: Purchase → Markup → Unit Price follows logical flow

### Backwards Compatibility
- Existing batch records without markup data will work normally
- Old workflows (entering prices directly) still function
- No database migration required
- Feature is purely UI/UX enhancement

## Related Features

### Price History Integration
The existing price history feature (implemented earlier) will automatically track:
- Purchase price changes
- Unit price changes
- **Markup percentage changes** (when prices are updated)

### Statistics Dashboard
Product statistics modal already shows:
- Profit margins
- Revenue
- Sales velocity

The new markup field complements these analytics by ensuring consistent profit margins during stock addition.

## Support

### Common Questions

**Q: What happens if I change the unit price manually after auto-calculation?**
A: The unit price accepts your manual entry, and the system displays the actual markup percentage based on your values.

**Q: Can I leave markup blank?**
A: Yes, markup is optional. You can still enter prices directly as before.

**Q: Does this affect existing batch records?**
A: No, this only applies to new batches being added. Existing records are unchanged.

**Q: What if my markup varies by customer or situation?**
A: Use the auto-calculation as a starting point, then manually adjust the unit price as needed.

**Q: Will this change my product's base price?**
A: No, this only affects the batch pricing. Product base price is separate.

## Conclusion

The markup auto-calculation feature streamlines batch management and bulk import workflows by automating price calculations while maintaining flexibility for special cases. It improves data entry speed, reduces errors, and provides immediate visibility into profit margins during stock addition operations.

---

**Status**: ✅ Implemented and Ready for Testing  
**Version**: 1.0  
**Last Updated**: November 13, 2024
