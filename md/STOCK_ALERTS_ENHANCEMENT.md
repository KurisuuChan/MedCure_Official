# Stock Alerts Report Enhancement

## Summary

Enhanced the Stock Alerts report in the Analytics & Reports page to include detailed medication information for low stock, out of stock, and expiring soon items across all export formats (TXT, CSV, PDF).

## Changes Made

### 1. PDF Export Enhancement

The Stock Alerts PDF now includes three detailed sections:

#### 📦 Low Stock Medications

- **Columns:**
  - Medication Name (Brand/Generic)
  - Category
  - Current Stock (pieces)
  - Reorder Level (threshold)
  - Stock Value (₱)
- **Styling:** Warm orange theme with warning icon
- **Details:** Shows all medications where current stock ≤ reorder level

#### 🚨 Out of Stock Medications

- **Columns:**
  - Medication Name (Brand/Generic)
  - Category
  - Reorder Level
  - Last Updated (date)
- **Styling:** Light red theme with alert icon
- **Details:** Shows medications with 0 stock

#### 📅 Medications Expiring Soon (30 Days)

- **Columns:**
  - Medication Name (Brand/Generic)
  - Category
  - Stock (pieces)
  - Expiry Date
  - Days Left (until expiration)
- **Styling:** Light yellow theme with calendar icon
- **Details:** Shows medications expiring within 30 days

### 2. CSV Export Enhancement

Enhanced CSV format with structured sections:

```csv
Stock Alerts Summary Report
Generated: [Date and Time]

SUMMARY
Alert Type,Count
Low Stock Items,[count]
Out of Stock,[count]
Expiring Soon (30 days),[count]
Total Alerts,[count]

LOW STOCK MEDICATIONS
Medication Name,Category,Current Stock,Reorder Level,Stock Value
[detailed rows...]

OUT OF STOCK MEDICATIONS
Medication Name,Category,Reorder Level,Last Updated
[detailed rows...]

MEDICATIONS EXPIRING SOON (30 DAYS)
Medication Name,Category,Stock,Expiry Date,Days Until Expiry
[detailed rows...]
```

### 3. TXT Export Enhancement

Enhanced TXT format with formatted sections:

```txt
================================================================================
STOCK ALERTS REPORT
MedCure Pharmacy
Generated: [Date and Time]
================================================================================

SUMMARY
--------------------------------------------------------------------------------
Low Stock Items:        [count]
Out of Stock:           [count]
Expiring Soon (30d):    [count]
Total Alerts:           [count]

================================================================================
⚠️  LOW STOCK MEDICATIONS
================================================================================

1. [Medication Name]
   Category:        [Category]
   Current Stock:   [X] pieces
   Reorder Level:   [Y] pieces
   Stock Value:     ₱[Amount]

[... more items ...]

================================================================================
🚨 OUT OF STOCK MEDICATIONS
================================================================================

1. [Medication Name]
   Category:        [Category]
   Reorder Level:   [X] pieces
   Last Updated:    [Date]

[... more items ...]

================================================================================
📅 MEDICATIONS EXPIRING SOON (30 DAYS)
================================================================================

1. [Medication Name]
   Category:        [Category]
   Stock:           [X] pieces
   Expiry Date:     [Date]
   Days Left:       [X] days

[... more items ...]
```

## Features

### Visual Indicators

- ⚠️ Low Stock: Yellow/Orange warning theme
- 🚨 Out of Stock: Red danger theme
- 📅 Expiring Soon: Yellow calendar theme

### Data Included

1. **Medication Names:** Shows brand name or generic name
2. **Categories:** Product category for organization
3. **Stock Levels:** Current stock and reorder thresholds
4. **Financial Data:** Stock value calculations for low stock items
5. **Expiry Information:** Days until expiration with formatted dates
6. **Timestamps:** Last updated information

### Automatic Page Breaks

The PDF export intelligently adds new pages when sections are too long, ensuring professional formatting.

### Color-Coded Tables

Each alert type has its own color scheme for easy identification:

- Low Stock: Orange (#F59E0B)
- Out of Stock: Red (#EF4444)
- Expiring Soon: Yellow (#A16207)

## Usage

1. Navigate to **Analytics & Reports** page
2. Find the **Stock Alerts** card
3. Click **"Check Stock"** button to generate the report
4. Export using any of the three buttons:
   - **TXT:** Formatted text report
   - **CSV:** Spreadsheet-compatible format
   - **PDF:** Professional printable report

## Benefits

✅ **Complete Medication Details:** See exactly which medications need attention
✅ **Action-Ready Information:** Reorder levels and stock values help with purchasing decisions
✅ **Expiry Tracking:** Know which items to prioritize selling before expiration
✅ **Professional Reports:** Suitable for inventory audits and management reviews
✅ **Multiple Formats:** Choose the format that works best for your workflow

## Technical Details

### File Modified

- `src/features/analytics/components/AnalyticsReportsPage.jsx`

### Functions Updated

- `exportToPDF()` - Added detailed medication tables
- `exportToCSV()` - Added structured sections with complete data
- `exportToTXT()` - Added formatted text layout with full details

### Data Source

Reports pull from:

- `reportData.lowStockItems` - Products with stock ≤ reorder level
- `reportData.fullData.lowStockAlerts` - Complete low stock data (filtered for out of stock)
- `reportData.fullData.expiryAnalysis.expiringProducts` - Products expiring within 30 days

## Date: October 15, 2025
