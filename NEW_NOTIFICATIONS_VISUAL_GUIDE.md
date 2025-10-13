# 🎨 New Notifications Visual Guide

## 📦 Stock Management Notifications

This guide shows the **4 new notification types** added to the MedCure system and how they appear in the UI.

---

## 1. ❌ Out of Stock Alert

### When It Appears

- **Automated**: Health check runs every 15 minutes
- **Trigger**: Product's `stock_in_pieces` reaches 0
- **Who Sees It**: Primary admin/manager only

### Visual Design

```
┌─────────────────────────────────────────────────────────┐
│ 🔔 ❌ Out of Stock Alert                   CRITICAL     │
├─────────────────────────────────────────────────────────┤
│ Paracetamol 500mg is completely out of stock!          │
│ Immediate reorder required.                             │
│                                                          │
│ 🔗 View Product                          ⏰ 5 mins ago │
└─────────────────────────────────────────────────────────┘
```

### Notification Panel Appearance

- **Icon**: ❌ (Red X)
- **Title**: "Out of Stock Alert"
- **Priority Badge**: `CRITICAL` (red background)
- **Body**: Product name + "is completely out of stock! Immediate reorder required."
- **Action Button**: "View Product" → Links to inventory page
- **Timestamp**: Relative time (e.g., "5 mins ago", "1 hour ago")

### Database Record

```javascript
{
  title: "❌ Out of Stock Alert",
  message: "Paracetamol 500mg is completely out of stock! Immediate reorder required.",
  type: "error",
  priority: 1, // CRITICAL
  category: "inventory",
  metadata: {
    productId: "uuid-123",
    productName: "Paracetamol 500mg",
    currentStock: 0,
    actionUrl: "/inventory?product=uuid-123",
    notification_key: "out-of-stock:uuid-123" // For duplicate prevention
  }
}
```

### Duplicate Prevention

- ✅ Won't send again for same product within 24 hours
- ✅ Uses `notification_key: "out-of-stock:{productId}"`
- ✅ Database function `should_send_notification()` checks cooldown

---

## 2. 📦 Stock Added

### When It Appears

- **Manual**: User adds stock via batch management
- **Trigger**: Successful batch creation with stock addition
- **Who Sees It**: User who performed the action

### Visual Design

```
┌─────────────────────────────────────────────────────────┐
│ 🔔 📦 Stock Added                          INFO          │
├─────────────────────────────────────────────────────────┤
│ 50 units of Paracetamol 500mg added                    │
│ (Batch: B-20240115-001). New stock: 120 pieces.       │
│                                                          │
│ 🔗 View Batch                            ⏰ Just now    │
└─────────────────────────────────────────────────────────┘
```

### Notification Panel Appearance

- **Icon**: 📦 (Package)
- **Title**: "Stock Added"
- **Priority Badge**: `INFO` (blue background)
- **Body**: Quantity + Product name + Batch number + New stock level
- **Action Button**: "View Batch" → Links to batch management page
- **Timestamp**: Relative time

### Database Record

```javascript
{
  title: "📦 Stock Added",
  message: "50 units of Paracetamol 500mg added (Batch: B-20240115-001). New stock: 120 pieces.",
  type: "success",
  priority: 5, // INFO
  category: "inventory",
  metadata: {
    productId: "uuid-123",
    productName: "Paracetamol 500mg",
    quantityAdded: 50,
    batchNumber: "B-20240115-001",
    newStockLevel: 120,
    actionUrl: "/batch-management?product=uuid-123",
    timestamp: "2024-01-15T10:30:00.000Z"
  }
}
```

### Real-World Example

```
User Flow:
1. User goes to Batch Management
2. Clicks "Add New Stock"
3. Selects product: Paracetamol 500mg
4. Enters quantity: 50
5. Selects expiry: 2025-12-31
6. Clicks Submit
7. ✅ Toast appears: "Successfully added 50 units..."
8. 🔔 Notification appears: "Stock Added"
```

---

## 3. ✅ Batch Received

### When It Appears

- **Manual**: User creates new batch via batch management
- **Trigger**: Successful batch creation (same as Stock Added)
- **Who Sees It**: User who performed the action

### Visual Design

```
┌─────────────────────────────────────────────────────────┐
│ 🔔 ✅ Batch Received                      LOW            │
├─────────────────────────────────────────────────────────┤
│ Batch B-20240115-001 of Paracetamol 500mg              │
│ (50 units) received. Expires: 2025-12-31               │
│                                                          │
│ 🔗 View Batch                            ⏰ Just now    │
└─────────────────────────────────────────────────────────┘
```

### Notification Panel Appearance

- **Icon**: ✅ (Green checkmark)
- **Title**: "Batch Received"
- **Priority Badge**: `LOW` (gray background)
- **Body**: Batch number + Product name + Quantity + Expiry date
- **Action Button**: "View Batch" → Links to batch management page (specific batch)
- **Timestamp**: Relative time

### Database Record

```javascript
{
  title: "✅ Batch Received",
  message: "Batch B-20240115-001 of Paracetamol 500mg (50 units) received. Expires: 2025-12-31",
  type: "success",
  priority: 4, // LOW
  category: "inventory",
  metadata: {
    batchNumber: "B-20240115-001",
    productName: "Paracetamol 500mg",
    quantity: 50,
    expiryDate: "2025-12-31",
    actionUrl: "/batch-management?batch=B-20240115-001"
  }
}
```

### Why Both Stock Added + Batch Received?

```
📦 Stock Added         →  Business perspective (inventory increased)
✅ Batch Received      →  Operational perspective (batch tracking)

Different users care about different aspects:
- Pharmacists: "How much stock do we have now?" (Stock Added)
- Managers: "Which batch number was this?" (Batch Received)
```

---

## 4. 📈 Stock Adjusted

### When It Appears

- **Manual**: User manually adjusts stock (feature needs integration)
- **Trigger**: Stock level changed with reason provided
- **Who Sees It**: User who performed the action

### Visual Design - Increase

```
┌─────────────────────────────────────────────────────────┐
│ 🔔 📈 Stock Adjusted                      LOW            │
├─────────────────────────────────────────────────────────┤
│ Paracetamol 500mg stock increased from 70 to           │
│ 120 pieces. Reason: Inventory recount                  │
│                                                          │
│ 🔗 View Product                          ⏰ 2 mins ago │
└─────────────────────────────────────────────────────────┘
```

### Visual Design - Decrease

```
┌─────────────────────────────────────────────────────────┐
│ 🔔 📉 Stock Adjusted                      LOW            │
├─────────────────────────────────────────────────────────┤
│ Paracetamol 500mg stock decreased from 120 to          │
│ 70 pieces. Reason: Damaged items removed               │
│                                                          │
│ 🔗 View Product                          ⏰ Just now    │
└─────────────────────────────────────────────────────────┘
```

### Notification Panel Appearance

- **Icon**: 📈 (up arrow) or 📉 (down arrow) - Dynamic
- **Title**: "Stock Adjusted"
- **Priority Badge**: `LOW` (gray background)
- **Body**: Product name + Increase/decrease + Old/new stock + Reason
- **Action Button**: "View Product" → Links to inventory page
- **Timestamp**: Relative time
- **Type**: Success (green) for increase, Warning (yellow) for decrease

### Database Record - Increase

```javascript
{
  title: "📈 Stock Adjusted",
  message: "Paracetamol 500mg stock increased from 70 to 120 pieces. Reason: Inventory recount",
  type: "success",
  priority: 4, // LOW
  category: "inventory",
  metadata: {
    productId: "uuid-123",
    productName: "Paracetamol 500mg",
    oldStock: 70,
    newStock: 120,
    difference: 50, // positive = increase
    reason: "Inventory recount",
    actionUrl: "/inventory?product=uuid-123"
  }
}
```

### Database Record - Decrease

```javascript
{
  title: "📉 Stock Adjusted",
  message: "Paracetamol 500mg stock decreased from 120 to 70 pieces. Reason: Damaged items removed",
  type: "warning",
  priority: 4, // LOW
  category: "inventory",
  metadata: {
    productId: "uuid-123",
    productName: "Paracetamol 500mg",
    oldStock: 120,
    newStock: 70,
    difference: -50, // negative = decrease
    reason: "Damaged items removed",
    actionUrl: "/inventory?product=uuid-123"
  }
}
```

---

## 🔔 Notification Bell Component

### Unread Count Badge

```
┌─────────────┐
│  🔔  [3]    │  ← Red badge shows unread count
└─────────────┘
```

### No Notifications

```
┌─────────────┐
│  🔔         │  ← No badge
└─────────────┘
```

### Loading State

```
┌─────────────┐
│  🔄  [2]    │  ← Spinner animation
└─────────────┘
```

---

## 📋 Notification Panel

### Panel Header

```
┌───────────────────────────────────────────────────────┐
│ 🔔 Notifications                    [Mark All Read]   │
├───────────────────────────────────────────────────────┤
```

### Empty State

```
├───────────────────────────────────────────────────────┤
│                                                        │
│                  📭                                    │
│             No notifications                           │
│         You're all caught up!                         │
│                                                        │
└───────────────────────────────────────────────────────┘
```

### With Notifications

```
├───────────────────────────────────────────────────────┤
│ ● ❌ Out of Stock Alert                  CRITICAL   ✕ │
│   Paracetamol 500mg is completely out...             │
│   🔗 View Product               5 mins ago            │
├───────────────────────────────────────────────────────┤
│ ○ 📦 Stock Added                         INFO      ✕ │
│   50 units of Paracetamol 500mg added...             │
│   🔗 View Batch                 Just now              │
├───────────────────────────────────────────────────────┤
│ ○ ✅ Batch Received                      LOW       ✕ │
│   Batch B-20240115-001 of Paracetamol...             │
│   🔗 View Batch                 Just now              │
├───────────────────────────────────────────────────────┤
│              [Load More]                              │
└───────────────────────────────────────────────────────┘
```

### Legend

- `●` = Unread (blue dot)
- `○` = Read (gray dot)
- `✕` = Dismiss button
- Priority badge colors:
  - `CRITICAL` = Red
  - `HIGH` = Orange
  - `MEDIUM` = Yellow
  - `LOW` = Gray
  - `INFO` = Blue

---

## 🎨 Color Scheme

### Priority Colors

```javascript
CRITICAL:  bg-red-100    text-red-800    border-red-200
HIGH:      bg-orange-100 text-orange-800 border-orange-200
MEDIUM:    bg-yellow-100 text-yellow-800 border-yellow-200
LOW:       bg-gray-100   text-gray-800   border-gray-200
INFO:      bg-blue-100   text-blue-800   border-blue-200
```

### Notification Type Colors

```javascript
ERROR:     bg-red-50    text-red-900    border-l-red-400
WARNING:   bg-yellow-50 text-yellow-900 border-l-yellow-400
SUCCESS:   bg-green-50  text-green-900  border-l-green-400
INFO:      bg-blue-50   text-blue-900   border-l-blue-400
```

### Status Colors

```javascript
Unread:    bg-blue-600  text-white
Read:      bg-gray-400  text-white
```

---

## 📱 Responsive Design

### Desktop (>1024px)

```
┌────────────────────────────────────────────────┐
│ Header                    🔔 [3]    👤 User   │
└────────────────────────────────────────────────┘
                              ↓ Click bell
        ┌────────────────────────────────────┐
        │ 🔔 Notifications    [Mark All]     │
        ├────────────────────────────────────┤
        │ ● ❌ Out of Stock Alert  CRITICAL │
        │   Message text...                  │
        ├────────────────────────────────────┤
        │ ○ 📦 Stock Added         INFO    │
        │   Message text...                  │
        └────────────────────────────────────┘
        Width: 384px (24rem)
        Max Height: 80vh
        Position: Dropdown from bell
```

### Mobile (<640px)

```
┌─────────────────────────┐
│ ☰  MedCure    🔔 [3] 👤│
└─────────────────────────┘
          ↓ Click bell
┌─────────────────────────┐
│ 🔔 Notifications        │
│         [Mark All]      │
├─────────────────────────┤
│ ● ❌ Out of Stock      │
│   Message text...       │
├─────────────────────────┤
│ ○ 📦 Stock Added       │
│   Message text...       │
└─────────────────────────┘
Width: 100vw - 2rem
Max Height: 80vh
Position: Full width
```

---

## ⚡ Real-time Behavior

### New Notification Arrives

```
1. ✅ Database insert via NotificationService
2. 📡 Supabase real-time channel broadcasts change
3. 🔔 NotificationBell receives update
4. 📊 Badge count increments (+1)
5. 🎨 Panel updates (if open)
6. 🔊 Optional: Sound notification (future)
```

### Mark as Read

```
1. 👆 User clicks notification
2. ⚡ Optimistic UI update (instant)
3. 📡 API call to mark as read
4. ✅ Database updated
5. 🔔 Badge count decrements (-1)
6. 🎨 Blue dot → Gray dot
```

### Dismiss

```
1. 👆 User clicks ✕ button
2. 🎭 Fade-out animation (200ms)
3. 📡 API call to dismiss
4. ✅ Database: dismissed_at set
5. 🗑️ Removed from panel
6. 🔔 Badge count decrements (-1)
```

---

## 🧪 Testing Scenarios

### Test 1: Out of Stock Alert

```bash
1. SQL: UPDATE products SET stock_in_pieces = 0 WHERE id = 'xyz'
2. Wait 15 minutes OR restart app
3. Check notification bell
4. Expected: ❌ Out of Stock Alert appears
```

### Test 2: Stock Added + Batch Received

```bash
1. Navigate to Batch Management
2. Click "Add New Stock"
3. Select product: Any product
4. Enter quantity: 50
5. Enter expiry: Future date
6. Click Submit
7. Expected: 2 notifications appear:
   - 📦 Stock Added
   - ✅ Batch Received
```

### Test 3: Duplicate Prevention

```bash
1. Trigger out of stock (set stock to 0)
2. Wait for health check to create notification
3. Manually call NotificationService.notifyOutOfStock()
4. Expected: Second notification NOT created
5. Check database: Last notification was within 24 hours
```

### Test 4: Real-time Updates

```bash
1. Open app in two browser windows
2. In Window 1: Add stock via batch management
3. In Window 2: Watch notification bell
4. Expected: Bell badge increments in real-time
```

---

## 📊 Database Schema

### user_notifications Table

```sql
CREATE TABLE user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- error, warning, success, info
  priority INTEGER NOT NULL, -- 1-5 (1=CRITICAL, 5=INFO)
  category TEXT NOT NULL, -- inventory, expiry, sales, system, general
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  dismissed_at TIMESTAMP,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX idx_user_notifications_created_at ON user_notifications(created_at DESC);
CREATE INDEX idx_user_notifications_is_read ON user_notifications(is_read);
```

---

## 🚀 Performance Optimizations

### Database

- ✅ Indexed queries on `user_id`, `created_at`, `is_read`
- ✅ Duplicate prevention via `should_send_notification()` function
- ✅ Automatic cleanup of old dismissed notifications (90 days)

### Real-time

- ✅ Supabase channels with filter `user_id=eq.{userId}`
- ✅ Only subscribe to own notifications
- ✅ Automatic reconnection on network failure

### UI

- ✅ Optimistic updates (instant UI response)
- ✅ Pagination (10 notifications per page)
- ✅ Virtual scrolling for large lists (future)
- ✅ Debounced mark-as-read (prevent spam)

---

**Visual Guide Version**: 1.0  
**Last Updated**: January 2025  
**Status**: ✅ Implementation Complete
