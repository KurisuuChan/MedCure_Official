# User Deletion System Documentation

## Overview

MedCure implements a **two-tier user deletion system** to ensure data integrity while providing flexibility for user management.

---

## 🎯 Deletion Tiers

### **Tier 1: Soft Delete (Deactivation)**

**For: Active Users**

- **Action**: Sets `is_active = false`
- **Data**: All data preserved (sales, logs, etc.)
- **Reversible**: Yes (can be reactivated)
- **Use Case**: Temporarily disable user access

**Visual Indicators:**

- Orange modal theme
- "Deactivate User" button
- Outline trash icon
- User remains in list with "Deactivated" badge

---

### **Tier 2: Hard Delete (Permanent)**

**For: Deactivated Users Only**

- **Action**: Removes user from database
- **Data**: User account deleted, activity logs deleted, sales preserved
- **Reversible**: No - **PERMANENT**
- **Use Case**: Clean up deactivated accounts with no critical data

**Visual Indicators:**

- Red modal theme
- "Permanently Delete" button
- Filled red trash icon
- Stronger warning messages

---

## 🛡️ Safety Features

### Pre-Delete Validation

Before attempting hard delete:

1. ✅ Checks if user is deactivated
2. ✅ Scans for associated records:
   - Sales transactions
   - Activity logs
   - Other foreign key relationships
3. ✅ Blocks deletion if sales records exist
4. ✅ Shows detailed error with blocking tables

### Confirmation Requirements

Both deletion types require:

- Type user's full name to confirm
- Match is case-insensitive
- Cannot proceed until confirmed

### Database Constraints

- Active users CANNOT be hard deleted
- Foreign key constraints prevent orphaned data
- Sales records are protected (business-critical)

---

## 📊 What Gets Deleted

### Soft Delete (Deactivation)

| Item          | Status                         |
| ------------- | ------------------------------ |
| User account  | ✅ Preserved (marked inactive) |
| Sales records | ✅ Preserved                   |
| Activity logs | ✅ Preserved                   |
| Login access  | ❌ Revoked                     |

### Hard Delete (Permanent)

| Item             | Status                         |
| ---------------- | ------------------------------ |
| User account     | ❌ DELETED                     |
| User credentials | ❌ DELETED                     |
| Activity logs    | ❌ DELETED                     |
| Sales records    | ✅ **PRESERVED** (intentional) |

**Important**: Sales records are intentionally preserved to maintain business data integrity and audit trails.

---

## 🔧 Technical Implementation

### Service Layer

**File**: `src/services/domains/auth/userManagementService.js`

#### Methods:

1. **`deleteUser(userId)`** - Soft delete

   - Updates `is_active = false`
   - Updates `updated_at` timestamp
   - Returns user data

2. **`hardDeleteUser(userId, options)`** - Hard delete

   - Validates user is inactive
   - Checks foreign key constraints
   - Optional cascade delete (activity logs only)
   - Returns deleted user data

3. **`getUserAssociatedRecords(userId)`** - Pre-delete check
   - Counts sales records
   - Counts activity logs
   - Returns `canDelete` boolean
   - Lists blocking tables

### UI Layer

**File**: `src/features/admin/components/UserManagementDashboard.jsx`

#### User Flow:

1. **Active User Deletion:**

   ```
   Click trash icon → Orange modal → Confirm → Deactivated
   ```

2. **Deactivated User Deletion:**

   ```
   Click filled trash icon → Check associations → Red modal → Confirm → Permanently deleted
   ```

3. **Blocked Deletion:**
   ```
   Click filled trash icon → Check associations → Error toast → Cancels
   ```

---

## 🎨 Visual Design

### Active Users

- **Row**: Normal appearance, blue avatar
- **Badge**: None
- **Delete Button**: Outline trash icon, orange hover
- **Tooltip**: "Deactivate user"

### Deactivated Users

- **Row**: Gray/faded background
- **Badge**: Red "Deactivated" badge next to name
- **Delete Button**: Filled trash icon, dark red
- **Tooltip**: "Permanently delete user"

### Modals

| Type        | Header Color    | Button Color | Icon       |
| ----------- | --------------- | ------------ | ---------- |
| Soft Delete | Orange gradient | Orange-600   | ⚠️ Warning |
| Hard Delete | Red gradient    | Red-700      | ⚠️ Warning |

---

## 💡 User Guide

### How to Deactivate a User

1. Navigate to **User Management**
2. Find the active user
3. Click the **trash icon** (outline)
4. Orange modal appears
5. Type the user's full name
6. Click **"Deactivate User"**
7. User is now inactive (can't log in)

### How to Permanently Delete a User

1. First, deactivate the user (see above)
2. User now shows "Deactivated" badge
3. Click the **filled trash icon** (red)
4. System checks for associated records
5. If user has sales: **Deletion blocked** ❌
6. If no sales: Red modal appears
7. Type the user's full name
8. Click **"Permanently Delete"**
9. User is removed from database ✅

### What If Deletion Is Blocked?

**Error Message:**

```
Cannot delete user: Has sales (X records).
These records must be deleted or reassigned first.
```

**Options:**

1. **Keep deactivated** (recommended) - User stays inactive, data intact
2. **Reassign sales** - Transfer sales to another user (manual SQL)
3. **Delete sales** - Remove sales records (⚠️ not recommended)

---

## 🔍 Troubleshooting

### "User is already deactivated"

- You clicked deactivate on an inactive user
- Use the filled trash icon for permanent deletion instead

### "Cannot permanently delete an active user"

- You must deactivate the user first
- This is a safety feature

### "User has associated records"

- User has sales transactions or other data
- Keep user deactivated or manually clean up records
- Sales should generally be preserved for audit purposes

### Foreign Key Constraint Errors

- Check console for detailed error message
- Identify which table is blocking (sales, logs, etc.)
- Decide: keep deactivated or manually resolve

---

## 🔒 Security & Permissions

### Who Can Delete Users?

- **Admin role**: Full access to both soft and hard delete
- **Pharmacist role**: Cannot delete users
- **Employee role**: Cannot delete users

### Audit Trail

All deletions are logged:

- User ID and name
- Deletion type (soft/hard)
- Timestamp
- Admin who performed action
- Result (success/blocked)

### Data Retention

- Soft deleted users: Retained indefinitely
- Hard deleted users: No recovery possible
- Sales data: Always preserved

---

## 📝 Database Schema Impact

### Soft Delete

```sql
UPDATE users
SET is_active = false,
    updated_at = NOW()
WHERE id = 'user_id';
```

### Hard Delete (without sales)

```sql
-- First: Delete activity logs
DELETE FROM user_activity_logs WHERE user_id = 'user_id';

-- Then: Delete user
DELETE FROM users WHERE id = 'user_id';
```

### Foreign Key Relationships

```
users (id)
├── sales (user_id) - PROTECTED, blocks deletion
├── user_activity_logs (user_id) - Deleted on cascade
└── audit_log (user_id) - May block deletion
```

---

## 🚀 Future Enhancements

### Potential Features:

1. **Bulk deactivation** - Deactivate multiple users at once
2. **Reactivation UI** - One-click restore deactivated users
3. **Scheduled deletion** - Auto-delete deactivated users after X days
4. **Export before delete** - Download user data before permanent removal
5. **Reassign wizard** - UI to reassign sales before deletion
6. **Deletion history** - Track who was deleted and when

---

## ⚠️ Important Notes

1. **Sales records are NEVER deleted** - This preserves business data integrity
2. **Deactivation is reversible** - Hard deletion is not
3. **Always deactivate first** - Cannot hard delete active users
4. **Check associations before delete** - System prevents orphaned data
5. **Type exact name to confirm** - Prevents accidental deletions

---

## 📞 Support

If you encounter issues:

1. Check browser console for detailed error messages
2. Verify user's associated records
3. Contact system administrator
4. Review this documentation

---

**Last Updated**: October 9, 2025
**Version**: 1.0.0
