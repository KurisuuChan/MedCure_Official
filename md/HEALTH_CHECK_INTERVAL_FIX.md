# Health Check Interval Fix - Manual Run Issue

## 🐛 Problem Identified

### Symptoms

- Manual health check shows "Critical: 1", "Expiring Soon: 1" in the UI
- But the comprehensive health email shows "Expiring Soon: 0"
- Executive summary doesn't include expiring medications
- Critical stock items missing from email

### Root Cause

When a **manual health check** is triggered, the system was still respecting the **automatic interval timers** for low stock and expiring product checks.

**What was happening:**

1. User clicks "Run Manual Health Check"
2. System bypasses debounce for the main health check
3. BUT still checks intervals for individual check types:
   - Low Stock Check: Only runs if `lastLowStockCheck` was > X minutes ago
   - Expiring Check: Only runs if `lastExpiringCheck` was > X minutes ago
   - Out of Stock Check: Always runs ✅
4. If expiring check was recently run, `shouldCheckExpiring = false`
5. Returns `{ count: 0, products: [] }` instead of actual data
6. Email shows 0 expiring items even though they exist

---

## ✅ Solution

### Code Changes

#### 1. Pass `force` Parameter Through Chain

```javascript
// In runHealthChecks()
const totalNotifications = await this.executeHealthChecks([primaryUser], force);
```

#### 2. Updated executeHealthChecks() Signature

```javascript
async executeHealthChecks(users, force = false) {
  // ...

  // For manual/forced runs, always check everything
  if (force) {
    logger.info("🚀 FORCED RUN - Checking ALL categories regardless of intervals");
  }

  // Check intervals with force override
  const shouldCheckLowStock =
    force ||  // <-- Added
    !this.lastLowStockCheck ||
    now - this.lastLowStockCheck >= lowStockIntervalMs;

  const shouldCheckExpiring =
    force ||  // <-- Added
    !this.lastExpiringCheck ||
    now - this.lastExpiringCheck >= expiringIntervalMs;
```

---

## 🎯 Behavior Changes

### Before Fix

| Check Type   | Manual Run        | Auto Run          |
| ------------ | ----------------- | ----------------- |
| Out of Stock | ✅ Always         | ✅ Always         |
| Low Stock    | ⏱️ Interval Check | ⏱️ Interval Check |
| Expiring     | ⏱️ Interval Check | ⏱️ Interval Check |

**Result:** Manual runs could SKIP checks if intervals hadn't elapsed!

### After Fix

| Check Type   | Manual Run    | Auto Run          |
| ------------ | ------------- | ----------------- |
| Out of Stock | ✅ Always     | ✅ Always         |
| Low Stock    | ✅ **FORCED** | ⏱️ Interval Check |
| Expiring     | ✅ **FORCED** | ⏱️ Interval Check |

**Result:** Manual runs ALWAYS check everything!

---

## 📧 Email Impact

### Before

```
🚨 URGENT: OUT OF STOCK PRODUCTS (3)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ Product A - COMPLETELY OUT OF STOCK
❌ Product B - COMPLETELY OUT OF STOCK
❌ Product C - COMPLETELY OUT OF STOCK

📦 LOW STOCK ALERTS (0 total)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
(Empty - skipped due to interval)

📅 EXPIRING PRODUCTS (0 total)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
(Empty - skipped due to interval)
```

### After

```
🚨 URGENT: OUT OF STOCK PRODUCTS (3)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ Product A
   • Status: COMPLETELY OUT OF STOCK
   • Manufacturer: ABC Pharma
   • Dosage: 10mg Tablet
   • Supplier: XYZ Medical
   • Batch: BAT123

📦 LOW STOCK ALERTS (1 total)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔥 CRITICAL LOW STOCK (1):
   🚨 Product D
      • Stock: 3 pieces (Reorder Level: 10)
      • Manufacturer: DEF Pharma
      • Dosage: 5mg Capsule
      ...

📅 EXPIRING PRODUCTS (1 total)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 EXPIRES WITHIN 7 DAYS (1):
   ⏰ Product E
      • Days Remaining: 5 days (Expires: Oct 20, 2025)
      • Manufacturer: GHI Pharma
      • Dosage: 20mg Tablet
      ...
```

---

## 🧪 Testing Checklist

- [x] Manual health check includes low stock items
- [x] Manual health check includes expiring items
- [x] Manual health check includes out of stock items
- [x] Automatic health checks still respect intervals
- [x] Email shows complete medication details
- [x] Force parameter passed through execution chain
- [x] Debug logging added for data tracing

---

## 📝 Additional Debug Logging Added

### Email Data Structure Logging

```javascript
logger.debug("📊 [Email Debug] Health Data Structure:", {
  outOfStock: {
    count: healthData.outOfStock.count,
    productsCount: healthData.outOfStock.products.length,
    firstProduct: healthData.outOfStock.products[0] || "none"
  },
  lowStock: { ... },
  expiring: { ... }
});
```

### Template Reception Logging

```javascript
logger.debug("📧 [Template Debug] Received data:", {
  outOfStockProducts: outOfStock?.products?.length || 0,
  lowStockProducts: lowStock?.products?.length || 0,
  expiringProducts: expiring?.products?.length || 0,
  totalNotifications,
});
```

---

## 🚀 Usage

### Manual Health Check (Web UI)

```javascript
// When user clicks "Run Manual Health Check"
await notificationService.runHealthChecks(true); // force = true
```

### Automatic Background Check

```javascript
// Scheduled automatic checks
await notificationService.runHealthChecks(); // force = false (default)
```

---

## 🔍 Why This Matters

### Critical for Patient Safety

- Expiring medications need IMMEDIATE attention
- Manual checks are often triggered when investigating issues
- Staff expect to see ALL current problems, not filtered by intervals
- Missing critical items in manual reports creates safety risks

### User Experience

- "Manual check" implies checking EVERYTHING NOW
- Interval-based filtering is for automatic background checks
- Users get frustrated when manual checks miss known issues
- Complete data builds trust in the system

---

## 📊 Data Flow (After Fix)

```
1. User clicks "Run Manual Health Check"
   ↓
2. runHealthChecks(force=true)
   - Bypasses debounce ✅
   - Bypasses scheduling ✅
   ↓
3. executeHealthChecks(users, force=true)
   - shouldCheckLowStock = true (forced) ✅
   - shouldCheckExpiring = true (forced) ✅
   - shouldCheckOutOfStock = true (always) ✅
   ↓
4. All checks run with complete queries
   - checkLowStockDetailed() ✅
   - checkExpiringProductsDetailed() ✅
   - checkOutOfStockDetailed() ✅
   ↓
5. Complete data passed to email
   - lowStock: { count, products: [...] } ✅
   - expiring: { count, products: [...] } ✅
   - outOfStock: { count, products: [...] } ✅
   ↓
6. Email template receives ALL data
   - Shows all critical items ✅
   - Shows all expiring items ✅
   - Shows all out of stock items ✅
   - Complete medication details ✅
```

---

## 🎯 Summary

**Fixed:** Manual health checks now ALWAYS check all categories regardless of interval settings.

**Impact:**

- ✅ Comprehensive health emails show complete data
- ✅ No missing critical/expiring items
- ✅ Manual checks are truly comprehensive
- ✅ Automatic checks still use interval optimization
- ✅ Better patient safety and inventory management
