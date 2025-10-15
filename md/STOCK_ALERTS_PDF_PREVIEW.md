# Stock Alerts PDF Report - Visual Preview

## Page Layout Example

```
╔═══════════════════════════════════════════════════════════════════════════╗
║ 🔵 MedCure Pharmacy                            Generated: Oct 15, 2025    ║
║    STOCK ALERTS REPORT                                      12:30 PM      ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                            ║
║  ┌────────────────────────────────────────────────────────────────────┐  ║
║  │ Report Generated: Oct 15, 2025 12:30                               │  ║
║  └────────────────────────────────────────────────────────────────────┘  ║
║                                                                            ║
║  ┌─────────────────────────────────────────────────────────────────────┐ ║
║  │ STOCK ALERTS SUMMARY                                                │ ║
║  ├─────────────────────────────────────────┬───────────────────────────┤ ║
║  │ Alert Type                              │ Count                     │ ║
║  ├─────────────────────────────────────────┼───────────────────────────┤ ║
║  │ Low Stock Items                         │ 4                         │ ║
║  │ Out of Stock                            │ 3                         │ ║
║  │ Expiring Soon (30 days)                 │ 1                         │ ║
║  │ Total Alerts                            │ 8                         │ ║
║  └─────────────────────────────────────────┴───────────────────────────┘ ║
║                                                                            ║
║  ┌─────────────────────────────────────────────────────────────────────┐ ║
║  │ ⚠️  LOW STOCK MEDICATIONS                                           │ ║
║  ├──────────────────┬──────────┬─────────┬─────────────┬───────────────┤ ║
║  │ Medication Name  │ Category │ Current │ Reorder Lvl │ Stock Value   │ ║
║  ├──────────────────┼──────────┼─────────┼─────────────┼───────────────┤ ║
║  │ Biogesic 500mg   │ Medicine │    8    │     10      │ ₱40.00        │ ║
║  │ Neozep Forte     │ Medicine │    5    │     10      │ ₱32.50        │ ║
║  │ Vitamin C 500mg  │ Vitamins │    9    │     15      │ ₱27.00        │ ║
║  │ Amoxicillin 500  │ Medicine │    7    │     10      │ ₱105.00       │ ║
║  └──────────────────┴──────────┴─────────┴─────────────┴───────────────┘ ║
║                                                                            ║
║  ┌─────────────────────────────────────────────────────────────────────┐ ║
║  │ 🚨 OUT OF STOCK MEDICATIONS                                         │ ║
║  ├─────────────────────┬──────────┬─────────────┬──────────────────────┤ ║
║  │ Medication Name     │ Category │ Reorder Lvl │ Last Updated         │ ║
║  ├─────────────────────┼──────────┼─────────────┼──────────────────────┤ ║
║  │ Paracetamol 500mg   │ Medicine │     10      │ Oct 12, 2025         │ ║
║  │ Ibuprofen 400mg     │ Medicine │     15      │ Oct 10, 2025         │ ║
║  │ Cetirizine 10mg     │ Medicine │     10      │ Oct 14, 2025         │ ║
║  └─────────────────────┴──────────┴─────────────┴──────────────────────┘ ║
║                                                                            ║
║  ┌─────────────────────────────────────────────────────────────────────┐ ║
║  │ 📅 MEDICATIONS EXPIRING SOON (30 DAYS)                              │ ║
║  ├────────────────┬──────────┬────────┬────────────────┬───────────────┤ ║
║  │ Medication     │ Category │ Stock  │ Expiry Date    │ Days Left     │ ║
║  ├────────────────┼──────────┼────────┼────────────────┼───────────────┤ ║
║  │ Ascof Lagundi  │ Medicine │   25   │ Nov 10, 2025   │ 26 days       │ ║
║  └────────────────┴──────────┴────────┴────────────────┴───────────────┘ ║
║                                                                            ║
║                                                                            ║
║ ──────────────────────────────────────────────────────────────────────── ║
║ Generated on October 15, 2025 at 12:30 | MedCure Pro v1.0               ║
║ CONFIDENTIAL - For Internal Use Only                                     ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

## Color Scheme

### Header Section

- **Background:** Professional Blue (#2563EB)
- **Text:** White
- **Logo/Title:** Bold, large font

### Low Stock Section

- **Header Background:** Warm Orange/Yellow (#FED7AA)
- **Table Header:** Orange (#F59E0B)
- **Icon:** ⚠️ Warning triangle
- **Alternating Rows:** Light orange (#FFF8F0)

### Out of Stock Section

- **Header Background:** Light Red (#FEE2E2)
- **Table Header:** Red (#EF4444)
- **Icon:** 🚨 Alert siren
- **Alternating Rows:** Very light red (#FEF2F2)

### Expiring Soon Section

- **Header Background:** Light Yellow (#FEF9C3)
- **Table Header:** Dark Yellow (#A16207)
- **Icon:** 📅 Calendar
- **Alternating Rows:** Very light yellow (#FEFCE8)

## Data Calculations

### Low Stock Items

- **Current Stock:** Actual pieces in inventory
- **Reorder Level:** Threshold for reordering
- **Stock Value:** `Current Stock × Price Per Piece`
- **Trigger:** When `Current Stock ≤ Reorder Level`

### Out of Stock Items

- **Filtered From:** Low stock alerts where stock = 0
- **Shows:** Category and when it was last updated
- **Critical:** Immediate attention required

### Expiring Soon Items

- **Window:** Next 30 days from current date
- **Days Left:** Calculated dynamically: `ceil((Expiry Date - Today) / 86400000)`
- **Priority:** Items with fewer days shown more urgently

## Report Information

### Header

- **Company Name:** MedCure Pharmacy
- **Report Type:** Stock Alerts Report
- **Generation Date:** Current date and time
- **Page Numbers:** Auto-numbered

### Footer

- **Generation Timestamp:** Full date and time
- **Version:** MedCure Pro v1.0
- **Confidentiality:** Internal use disclaimer

## Professional Features

✅ **Multi-page Support:** Automatically adds pages when content is long
✅ **Consistent Styling:** Professional color scheme throughout
✅ **Clear Sections:** Each alert type clearly separated
✅ **Actionable Data:** All information needed for decision-making
✅ **Print-Ready:** Optimized for A4 paper size
✅ **Easy Scanning:** Color-coded for quick identification of issues

## Usage Scenarios

### Daily Operations

- Print and review each morning
- Identify critical stock needs
- Plan reordering priorities

### Inventory Audits

- Document current stock status
- Track expiring products
- Maintain compliance records

### Management Reports

- Present to pharmacy manager/owner
- Support purchasing decisions
- Show inventory health metrics

### Supplier Orders

- Use as reference for reordering
- Calculate quantities needed
- Prioritize urgent needs

## Export Filename Format

`stock_alerts_YYYY-MM-DD.pdf`

Example: `stock_alerts_2025-10-15.pdf`
