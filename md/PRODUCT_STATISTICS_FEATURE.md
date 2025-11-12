# Product Statistics & Analytics Feature

## Overview
Added comprehensive per-product statistics and analytics accessible directly from the inventory page. This feature provides detailed insights into sales performance, profitability, and inventory metrics for each medicine/product.

## Implementation Date
January 2024

## What Was Added

### 1. Product Statistics Modal Component
**File:** `src/components/analytics/ProductStatisticsModal.jsx`

A comprehensive modal that displays detailed analytics for individual products, including:

#### Key Metrics Dashboard
- **Total Revenue** - Total sales revenue from the product
- **Total Profit** - Net profit (Revenue - Cost of Goods Sold)
- **Units Sold** - Total number of units sold
- **Current Stock** - Current inventory level with low stock warnings

#### Performance Metrics (Time-Based)
- **Average Order Value** - Average revenue per transaction
- **Average Units per Order** - Average quantity per sale
- **Sales Velocity** - Units sold per day
- **Inventory Turnover Rate** - How many times inventory has turned over
- **Days Since Last Sale** - Time since product was last sold
- **Estimated Days Until Out of Stock** - Predictive metric based on sales velocity

#### Pricing & Cost Analysis
- **Unit Price** - Current selling price per unit
- **Cost Price** - Current cost per unit
- **Profit Per Unit** - Unit price minus cost price
- **Markup %** - Current markup percentage
- **Profit Margin %** - Calculated from actual sales data

#### Interactive Features
- **Time Range Filter** - View statistics for:
  - Last 7 Days
  - Last 30 Days (default)
  - Last 90 Days
  - Last Year
  - All Time
- **Low Stock Warnings** - Automatic alerts when stock is at or below reorder level
- **Color-Coded Metrics** - Visual indicators for profit/loss, stock levels, urgency

### 2. Statistics Icon in Inventory Table
**Modified Files:**
- `src/features/inventory/components/ProductRow.jsx`
- `src/features/inventory/components/ProductCard.jsx`
- `src/features/inventory/components/ProductListSection.jsx`
- `src/pages/InventoryPage.jsx`

#### Table View (ProductRow)
- Added **BarChart3** icon button in green color
- Positioned between Edit and Archive buttons
- Hover effect with scale animation
- Tooltip: "View Statistics"

#### Grid View (ProductCard)
- Added **BarChart3** icon button in purple color
- Positioned between Edit and Delete buttons
- Consistent with table view functionality
- Tooltip: "View Statistics"

### 3. Integration with Main Inventory Page
**File:** `src/pages/InventoryPage.jsx`

#### State Management
```javascript
const [showStatisticsModal, setShowStatisticsModal] = useState(false);
const [statisticsProduct, setStatisticsProduct] = useState(null);
```

#### Handler Function
```javascript
const handleViewStatistics = (product) => {
  setStatisticsProduct(product);
  setShowStatisticsModal(true);
};
```

#### Modal Rendering
```javascript
{showStatisticsModal && statisticsProduct && (
  <ProductStatisticsModal
    product={statisticsProduct}
    onClose={() => {
      setShowStatisticsModal(false);
      setStatisticsProduct(null);
    }}
  />
)}
```

## Data Sources

### Primary Data Tables
1. **`sale_items`** - Individual sale line items
   - `product_id` - Product reference
   - `quantity` - Units sold
   - `unit_price` - Price at time of sale
   - `sale_id` - Reference to parent sale

2. **`sales`** - Sale transactions
   - `created_at` - Sale date/time
   - `total_amount` - Total transaction value
   - `total_cogs` - Total cost of goods sold
   - `gross_profit` - Calculated profit

3. **`products`** - Product master data
   - `cost_price` - Current cost per unit
   - `price_per_piece` - Current selling price
   - `markup_percentage` - Current markup
   - `stock_in_pieces` - Current inventory
   - `reorder_level` - Minimum stock threshold

## Calculated Metrics

### Revenue Calculations
```javascript
totalRevenue = Σ(quantity × unit_price) for all sales
totalCost = totalUnitsSold × current_cost_price
totalProfit = totalRevenue - totalCost
profitMargin = (totalProfit / totalRevenue) × 100
```

### Performance Metrics
```javascript
avgOrderValue = totalRevenue / uniqueTransactions
avgUnitsPerOrder = totalUnitsSold / uniqueTransactions
salesVelocity = totalUnitsSold / daysInRange
turnoverRate = totalUnitsSold / currentStock
daysUntilOutOfStock = currentStock / salesVelocity
```

## User Interface Features

### Visual Design
- **Gradient Backgrounds** - Color-coded metric cards
  - Green: Revenue (positive)
  - Blue/Red: Profit (positive/negative)
  - Purple: Units Sold
  - Gray/Orange: Stock Status
- **Icons** - Lucide React icons for visual clarity
- **Responsive Layout** - Grid layout adapts to screen size
- **Smooth Animations** - Loading states and transitions

### Color Coding
- **Green** - Positive metrics, good status
- **Blue** - Neutral/informational
- **Orange** - Warnings (low stock, expiring)
- **Red** - Critical (negative profit, out of stock)
- **Purple** - Accent/highlight metrics

### Interactive Elements
- **Time Range Toggle** - Quick switching between periods
- **Hover Effects** - Visual feedback on interactive elements
- **Loading States** - Spinner during data fetch
- **Empty States** - Graceful handling of no data

## Business Intelligence Features

### Inventory Management Insights
1. **Stock Velocity Analysis** - Understand how fast products move
2. **Turnover Rate** - Identify slow-moving vs fast-moving items
3. **Reorder Predictions** - Estimate when to reorder based on current velocity
4. **Stock Level Warnings** - Immediate alerts for low stock

### Financial Analysis
1. **Profit Tracking** - Real profit from actual sales vs theoretical markup
2. **Revenue Contribution** - Identify top revenue generators
3. **Margin Analysis** - Compare actual profit margin to expected markup
4. **Cost Efficiency** - Track cost vs revenue relationship

### Sales Performance
1. **Transaction Analysis** - Average order size and value
2. **Sales Frequency** - Days since last sale tracking
3. **Trend Analysis** - Performance over different time periods
4. **Volume Metrics** - Total units moved

## Technical Implementation

### Data Fetching
- Uses Supabase client for real-time data
- Efficient JOIN queries on `sale_items` and `sales` tables
- Filtered by `product_id` and date range
- Ordered by date descending for recent data first

### Performance Optimizations
- Single query fetch with efficient JOINs
- Date filtering at database level
- Calculations performed on client side for flexibility
- Lazy loading - only fetch when modal opens

### Error Handling
- Try-catch blocks for all async operations
- Graceful error messages to console
- Loading states during data fetch
- Empty state handling for products with no sales

## User Workflow

### Accessing Statistics
1. Navigate to **Inventory** page
2. Locate desired product in grid or table view
3. Click the **BarChart3** (statistics) icon
4. Modal opens with default 30-day view

### Analyzing Data
1. Review key metrics at the top (revenue, profit, units, stock)
2. Select different time periods using toggle buttons
3. Examine performance metrics for detailed insights
4. Check pricing & cost breakdown
5. Review any low stock warnings

### Closing Modal
1. Click **X** button in top-right corner
2. Click outside modal (backdrop)
3. Press **Escape** key

## Icon Placement

### Table View Actions (Left to Right)
1. 👁️ **Eye** (Blue) - View Details
2. ✏️ **Edit** (Gray) - Edit Product
3. 📊 **BarChart3** (Green) - **View Statistics** ← NEW
4. 📦 **Archive** (Orange) - Archive Product

### Grid View Actions (Left to Right)
1. 👁️ **Eye** (Blue) - View Details
2. ✏️ **Edit** (Green) - Edit Product
3. 📊 **BarChart3** (Purple) - **View Statistics** ← NEW
4. 🗑️ **Trash2** (Red) - Delete Product

## Benefits

### For Pharmacy Management
- Quick access to product performance without navigating away
- Data-driven inventory decisions
- Identify profitable vs unprofitable products
- Optimize stock levels based on velocity

### For Business Analysis
- Compare product performance across different time periods
- Track profitability trends
- Identify best-sellers and slow-movers
- Make informed pricing decisions

### For Operations
- Predict stockout dates
- Optimize reorder timing
- Reduce carrying costs
- Improve cash flow through better inventory management

## Future Enhancements (Potential)

### Visualizations
- Line charts showing sales trends over time
- Bar charts comparing monthly performance
- Donut charts for profit breakdown
- Sparklines in the main table for quick trend views

### Advanced Analytics
- Customer segmentation (who buys this product)
- Seasonal pattern detection
- Price elasticity analysis
- Bundle analysis (what else customers buy)

### Export Capabilities
- Export statistics to PDF
- Export to CSV for further analysis
- Email reports automatically

### Comparative Analysis
- Compare multiple products side-by-side
- Category-level aggregations
- Top 10 performers dashboard
- Benchmark against category averages

## Files Modified

### New Files Created
1. `src/components/analytics/ProductStatisticsModal.jsx` (353 lines)

### Existing Files Modified
1. `src/features/inventory/components/ProductRow.jsx`
   - Added `BarChart3` import
   - Added `onViewStatistics` prop
   - Added statistics button in actions column

2. `src/features/inventory/components/ProductCard.jsx`
   - Added `BarChart3` import
   - Added `onViewStatistics` prop
   - Added statistics button in actions row

3. `src/features/inventory/components/ProductListSection.jsx`
   - Added `handleViewStatistics` prop
   - Passed handler to ProductRow component
   - Passed handler to ProductCard component

4. `src/pages/InventoryPage.jsx`
   - Added `ProductStatisticsModal` import
   - Added state variables for statistics modal
   - Added `handleViewStatistics` handler function
   - Passed handler to ProductListSection
   - Added modal rendering in JSX

## Testing Checklist

### Functional Testing
- ✅ Statistics icon appears in table view
- ✅ Statistics icon appears in grid view
- ✅ Modal opens when icon clicked
- ✅ Data loads correctly for products with sales
- ✅ Empty state shows for products without sales
- ✅ Time range filter switches correctly
- ✅ All metrics calculate accurately
- ✅ Modal closes properly
- ✅ Low stock warnings display when appropriate

### UI/UX Testing
- ✅ Icons have proper hover effects
- ✅ Color coding is consistent and meaningful
- ✅ Layout is responsive on different screen sizes
- ✅ Loading states display during data fetch
- ✅ Tooltips provide helpful context
- ✅ Typography is readable and hierarchical

### Performance Testing
- ✅ Modal opens quickly
- ✅ Data fetches efficiently
- ✅ No memory leaks on modal close
- ✅ Calculations perform well with large datasets

## Summary

The Product Statistics feature provides comprehensive, easily accessible analytics for individual products directly from the inventory page. With a single click on the new statistics icon, users can view detailed sales performance, profitability metrics, inventory insights, and predictive analytics for any product. The feature integrates seamlessly with the existing inventory interface and provides actionable business intelligence to support data-driven decision-making.

The implementation includes:
- ✅ New statistics modal component with comprehensive metrics
- ✅ Statistics icon in both table and grid views
- ✅ Time-based filtering (7/30/90/365 days, all time)
- ✅ Real-time data from Supabase
- ✅ Color-coded visual indicators
- ✅ Low stock warnings
- ✅ Predictive analytics (days until out of stock)
- ✅ Clean, professional UI with responsive design
- ✅ No compilation errors
- ✅ Fully integrated with existing inventory page

This feature significantly enhances the inventory management system by providing granular, product-level insights that were previously not available without manual data analysis.
