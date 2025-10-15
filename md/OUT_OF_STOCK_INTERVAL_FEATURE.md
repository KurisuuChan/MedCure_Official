# 🎯 Out-of-Stock Check Interval Configuration - Implementation Complete

## ✅ Feature Overview

Added configurable time intervals for **out-of-stock alerts** in the notification settings, matching the functionality already available for low-stock and expiring product alerts.

### Previous Behavior

- ❌ Out-of-stock alerts were **hardcoded as "Always Immediate"**
- ❌ No user control over check frequency
- ❌ Could create unnecessary load with very frequent checks

### New Behavior

- ✅ **Configurable interval selector** (15 min to 6 hours)
- ✅ **Default: 30 minutes** (recommended for most pharmacies)
- ✅ **Consistent with other notification intervals**
- ✅ **Saves to database and localStorage** for persistence

---

## 🔧 Technical Implementation

### Files Modified

#### 1. **NotificationManagement.jsx**

**Location:** `src/components/settings/NotificationManagement.jsx`

**Changes:**

- Added `outOfStockCheckInterval: 30` to component state (default 30 minutes)
- Updated settings loading to include `outOfStockCheckInterval` from global settings
- Updated save function to persist `outOfStockCheckInterval` via `updateSettings()`
- **Replaced static "Always Immediate" section** with configurable dropdown selector:
  ```jsx
  {
    /* Out of Stock Alert Interval */
  }
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-700">
      Out of Stock Check Interval
    </label>
    <select
      value={notificationSettings.outOfStockCheckInterval}
      onChange={(e) =>
        setNotificationSettings((prev) => ({
          ...prev,
          outOfStockCheckInterval: parseInt(e.target.value),
        }))
      }
      className="w-full border border-gray-300 rounded-lg px-4 py-2"
    >
      <option value={15}>Every 15 minutes (Very Frequent)</option>
      <option value={30}>Every 30 minutes (Recommended) ⭐</option>
      <option value={60}>Every 1 hour</option>
      <option value={120}>Every 2 hours</option>
      <option value={180}>Every 3 hours</option>
      <option value={360}>Every 6 hours</option>
    </select>
  </div>;
  ```

#### 2. **SettingsContext.jsx**

**Location:** `src/contexts/SettingsContext.jsx`

**Changes:**

- Added `outOfStockCheckInterval: 30` to `DEFAULT_SETTINGS` (30 minutes default)
- Added `case "out_of_stock_check_interval"` to settings loading switch statement
- Added `outOfStockCheckInterval: "out_of_stock_check_interval"` to `settingsMap` for database persistence

**Code:**

```javascript
const DEFAULT_SETTINGS = {
  businessName: "MedCure Pro",
  businessLogo: null,
  currency: "PHP",
  taxRate: "12",
  timezone: "Asia/Manila",
  enableNotifications: true,
  enableEmailAlerts: true,
  lowStockCheckInterval: 60, // minutes (1 hour default)
  expiringCheckInterval: 360, // minutes (6 hours default)
  outOfStockCheckInterval: 30, // minutes (30 minutes default) ✅ NEW
  emailAlertsEnabled: false,
};
```

#### 3. **NotificationService.js**

**Location:** `src/services/notifications/NotificationService.js`

**Changes:**

- Added `this.lastOutOfStockCheck = null` to track out-of-stock checks separately
- Updated `getUserNotificationSettings()` to include `outOfStockCheckInterval: 30` in default settings
- Modified `executeHealthChecks()` to:
  - Calculate `outOfStockIntervalMs` from user settings
  - Check `shouldCheckOutOfStock` based on interval (instead of always checking)
  - Update `this.lastOutOfStockCheck` timestamp after successful check
  - Log out-of-stock interval settings and check status

**Key Code Changes:**

```javascript
// Initialize timestamp tracking (constructor)
this.lastOutOfStockCheck = null; // ✅ NEW

// Default settings
getUserNotificationSettings() {
  return {
    lowStockCheckInterval: 60,
    expiringCheckInterval: 360,
    outOfStockCheckInterval: 30, // ✅ NEW
    emailAlertsEnabled: false,
  };
}

// Health check scheduling
const outOfStockIntervalMs = userSettings.outOfStockCheckInterval * 60 * 1000; // ✅ NEW
const shouldCheckOutOfStock =
  force ||
  !this.lastOutOfStockCheck ||
  now - this.lastOutOfStockCheck >= outOfStockIntervalMs; // ✅ NEW

// Conditional execution (instead of always checking)
shouldCheckOutOfStock
  ? this.checkOutOfStockDetailed(users)
  : Promise.resolve({ count: 0, products: [] }); // ✅ NEW

// Update timestamp after check
if (shouldCheckOutOfStock) {
  this.lastOutOfStockCheck = now; // ✅ NEW
}
```

#### 4. **NOTIFICATION_SYSTEM_PRODUCTION_READY.md**

**Location:** `md/NOTIFICATION_SYSTEM_PRODUCTION_READY.md`

**Changes:**

- Updated documentation to reflect configurable out-of-stock intervals
- Changed "always immediate - cannot be disabled" to "configurable 15 min to 6 hours, default 30 min"
- Updated usage instructions to show recommended 30-minute interval

---

## 🎨 User Interface

### Notification Settings Panel

The settings panel now shows **three configurable intervals** side by side:

```
┌─────────────────────────────────────────────────────────────┐
│ 📊 Notification Check Intervals                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Low Stock Check Interval                                    │
│ ┌─────────────────────────────────────────────────────┐    │
│ │ Every 1 hour (Recommended) ⭐                        │    │
│ └─────────────────────────────────────────────────────┘    │
│                                                             │
│ Expiring Products Check Interval                           │
│ ┌─────────────────────────────────────────────────────┐    │
│ │ Every 6 hours (Recommended) ⭐                       │    │
│ └─────────────────────────────────────────────────────┘    │
│                                                             │
│ Out of Stock Check Interval                           ✨NEW│
│ ┌─────────────────────────────────────────────────────┐    │
│ │ Every 30 minutes (Recommended) ⭐                    │    │
│ └─────────────────────────────────────────────────────┘    │
│                                                             │
│ Options: 15min, 30min, 1hr, 2hr, 3hr, 6hr                  │
└─────────────────────────────────────────────────────────────┘
```

### Dropdown Options

| Interval          | Use Case                                                   |
| ----------------- | ---------------------------------------------------------- |
| **15 minutes**    | Very Frequent - High-volume pharmacies with rapid turnover |
| **30 minutes ⭐** | Recommended - Balanced approach for most pharmacies        |
| **1 hour**        | Moderate - Standard monitoring                             |
| **2 hours**       | Relaxed - Slower-moving inventory                          |
| **3 hours**       | Infrequent - Low turnover                                  |
| **6 hours**       | Minimal - Overnight monitoring only                        |

---

## 💾 Data Persistence

### Dual Storage Strategy

1. **LocalStorage** (`medcure-notification-settings`)

   - Immediate availability for NotificationService
   - Fast access without database queries
   - Browser-specific storage

2. **Supabase Database** (`system_settings` table)
   - Cross-browser persistence
   - Team-wide consistency
   - Field: `out_of_stock_check_interval` (integer, minutes)

### Database Schema

```sql
-- system_settings table
INSERT INTO system_settings (setting_key, setting_value, setting_type)
VALUES ('out_of_stock_check_interval', 30, 'integer');
```

---

## 🔄 How It Works

### Health Check Flow

1. **User Saves Settings**

   - `outOfStockCheckInterval` saved to localStorage
   - Persisted to Supabase via `updateSettings()`

2. **NotificationService Reads Settings**

   - `getUserNotificationSettings()` loads from localStorage
   - Falls back to default (30 minutes) if not found

3. **Scheduled Health Checks**

   - `executeHealthChecks()` calculates time since last out-of-stock check
   - Compares against `outOfStockCheckInterval` setting
   - **Skips check** if interval hasn't elapsed (unless forced)
   - **Runs check** if interval has passed

4. **Timestamp Tracking**
   - `this.lastOutOfStockCheck` updated after successful check
   - Used for future interval calculations
   - Prevents excessive database queries

### Logging Examples

```javascript
⏱️ User Settings: Low Stock=60min, Expiring=360min, Out-of-Stock=30min
📊 Last Checks: Low Stock=15min ago, Expiring=120min ago, Out-of-Stock=10min ago
🎯 Running Checks: Low Stock=⏭️ SKIP, Expiring=⏭️ SKIP, Out-of-Stock=⏭️ SKIP

// After 30 minutes pass for out-of-stock
📊 Last Checks: Low Stock=45min ago, Expiring=150min ago, Out-of-Stock=30min ago
🎯 Running Checks: Low Stock=⏭️ SKIP, Expiring=⏭️ SKIP, Out-of-Stock=✅ YES
```

---

## ✅ Benefits

### For Users

- ✅ **Full control** over notification frequency
- ✅ **Reduced alert fatigue** with smart intervals
- ✅ **Consistent UI** across all notification types
- ✅ **Recommended defaults** for quick setup

### For System Performance

- ✅ **Reduced database load** (no unnecessary checks)
- ✅ **Configurable resource usage** based on pharmacy needs
- ✅ **Smart caching** with timestamp tracking
- ✅ **Scalable design** for future interval types

### For Development

- ✅ **Code consistency** with low-stock/expiring patterns
- ✅ **Easy maintenance** with unified interval logic
- ✅ **Clear logging** for debugging
- ✅ **Well-documented** implementation

---

## 🧪 Testing Checklist

- [x] Settings save to localStorage correctly
- [x] Settings persist to Supabase database
- [x] NotificationService reads settings on initialization
- [x] Health checks respect configured intervals
- [x] Timestamp tracking works correctly
- [x] Manual "Force Run" bypasses intervals
- [x] UI shows current interval selection
- [x] Documentation updated

---

## 📊 Default Configuration

| Setting          | Default Value  | Reasoning                                                    |
| ---------------- | -------------- | ------------------------------------------------------------ |
| Low Stock        | 60 minutes     | Moderate - 1 hour balances responsiveness and load           |
| Expiring         | 360 minutes    | Relaxed - 6 hours sufficient for expiry monitoring           |
| **Out of Stock** | **30 minutes** | **Urgent - More frequent than low stock, but not excessive** |

**Why 30 minutes for out-of-stock?**

- More critical than low stock (stock is completely depleted)
- Less critical than "always immediate" (allows some breathing room)
- Balances urgency with system performance
- Aligns with typical pharmacy restocking workflows

---

## 🎯 Future Enhancements

Potential future improvements:

- [ ] Different intervals for different product categories (e.g., critical meds vs. general supplies)
- [ ] Dynamic intervals based on product turnover rate
- [ ] Business hours vs. after-hours intervals
- [ ] Integration with supplier ordering systems
- [ ] Predictive alerts based on historical usage patterns

---

## 📝 Summary

**What Changed:**

- Out-of-stock alerts are now **configurable** (15 min to 6 hours)
- Default interval: **30 minutes** (recommended)
- Consistent with low-stock and expiring product settings
- Full persistence to localStorage and Supabase

**User Impact:**

- More control over notification frequency
- Reduced alert fatigue with smart defaults
- Improved system performance with optimized check intervals

**Technical Impact:**

- 4 files modified (UI, Context, Service, Documentation)
- No breaking changes to existing functionality
- Follows established patterns for consistency
- Well-logged for debugging and monitoring

---

## ✨ Completion Status

✅ **FEATURE COMPLETE** - Ready for production use!

**Last Updated:** December 2024
**Status:** Implemented and Tested
**Version:** 1.0.0
