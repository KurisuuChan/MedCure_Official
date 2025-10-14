# 🎯 Quick Reference: Database Cleanup Action Plan

## 📋 Step-by-Step Guide

### Step 1: Backup Your Database

```bash
# Create full backup
pg_dump -U postgres -h your-supabase-host -d postgres > backup_$(date +%Y%m%d_%H%M%S).sql

# Or use Supabase dashboard: Settings → Database → Backups
```

### Step 2: Run Investigation (Optional but Recommended)

```sql
-- Run in Supabase SQL Editor
-- File: database/INVESTIGATE_UNCERTAIN_TABLES.sql
-- Duration: ~2 minutes
-- Purpose: Understand which tables are truly unused
```

### Step 3: Phase 1 - Safe Deletion

```sql
-- Run in Supabase SQL Editor
-- File: database/SAFE_TABLE_CLEANUP.sql
-- Duration: ~30 seconds
-- Tables Deleted: 10 unused tables
-- Risk: ✅ LOW (100% confidence these are unused)
```

**Tables that will be deleted:**

1. disposal_records
2. disposal_items
3. disposal_approvals
4. expired_products_clearance
5. purchase_orders
6. purchase_order_items
7. suppliers
8. product_suppliers
9. batch_inventory (legacy)
10. health_check_log (duplicate)

### Step 4: Test Your Application

- [ ] Open your application
- [ ] Test all major features:
  - [ ] POS/Sales
  - [ ] Inventory management
  - [ ] User management
  - [ ] Reports/Analytics
  - [ ] Notifications
- [ ] Check browser console for errors
- [ ] Check Supabase logs for errors

### Step 5: Phase 2 - Optional Deletion (If needed)

```sql
-- Run in Supabase SQL Editor
-- File: database/OPTIONAL_TABLE_CLEANUP_PHASE2.sql
-- Duration: ~30 seconds
-- Tables: 3 minimally used tables
-- Risk: ⚠️ MEDIUM (uncomment lines to activate)
```

**Tables available for optional deletion:**

- health_check_runs (only logged, never queried)
- login_attempts (system uses localStorage instead)
- notification_deduplication (may break deduplication)

---

## 🎯 Quick Decision Matrix

### DELETE NOW (High Confidence)

```
✅ disposal_records, disposal_items, disposal_approvals
   → No disposal management system implemented

✅ expired_products_clearance
   → No clearance tracking implemented

✅ purchase_orders, purchase_order_items
   → No PO management system

✅ suppliers, product_suppliers
   → No supplier management features

✅ batch_inventory
   → Legacy table, replaced by 'batches'

✅ health_check_log
   → Duplicate, 'health_check_runs' exists
```

### CONSIDER DELETE (Medium Confidence)

```
⚠️ health_check_runs
   → Only written to, never read
   → Impact: Loss of health check history

⚠️ login_attempts
   → System uses localStorage instead
   → Impact: Loss of login attempt history

⚠️ notification_deduplication
   → May be used by DB functions
   → Impact: May get duplicate notifications
```

### KEEP (Actively Used)

```
✅ products, sales, sale_items - Core business tables
✅ users, user_activity_logs - User management
✅ categories, batches - Inventory management
✅ customers - Customer management
✅ user_notifications - Notification system
✅ system_settings - System configuration
✅ backup_logs - Backup management
✅ inventory_logs, stock_movements - Audit trail
✅ audit_log - System audit
```

### INVESTIGATE FIRST

```
❓ user_profiles, user_roles, user_permissions
   → May be used by RLS policies or auth

❓ user_sessions
   → May be used for session management

❓ user_preferences
   → May be used for user settings

❓ password_reset_tokens, two_factor_codes
   → May be used by auth system
```

---

## 📊 Expected Results

### Before Cleanup:

- Total Tables: 38
- Database Size: ~X MB

### After Phase 1 Cleanup:

- Total Tables: 28 (26% reduction)
- Database Size: ~X MB (estimate: 10-20% smaller)
- Unused Tables Removed: 10

### After Phase 2 Cleanup (Optional):

- Total Tables: 25 (34% reduction)
- Database Size: ~X MB (estimate: 15-25% smaller)
- Unused Tables Removed: 13

---

## ⚠️ Safety Checklist

Before running cleanup scripts:

- [ ] **Backup created** ✅
- [ ] **Reviewed analysis document** (DATABASE_TABLES_ANALYSIS.md)
- [ ] **Tested current system** (everything works)
- [ ] **Have rollback plan** (can restore from backup)
- [ ] **Informed team** (if working with others)
- [ ] **Scheduled maintenance window** (if in production)

---

## 🚨 Rollback Plan (If Something Breaks)

### Option 1: Restore from Backup

```bash
# Restore full database
psql -U postgres -h your-supabase-host -d postgres < backup_YYYYMMDD_HHMMSS.sql
```

### Option 2: Recreate Specific Table

```sql
-- Check your schema file for table definition
-- Example: Restore disposal_records
CREATE TABLE public.disposal_records (
  -- ... copy definition from schema
);
```

---

## 📈 Performance Tips

After cleanup, optimize your database:

```sql
-- Reclaim disk space
VACUUM FULL ANALYZE;

-- Update statistics
ANALYZE;

-- Check database size
SELECT
    pg_size_pretty(pg_database_size(current_database())) as database_size;

-- Check table sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 20;
```

---

## 📞 Support

If you encounter issues:

1. **Check Supabase Logs**

   - Dashboard → Database → Logs
   - Look for errors after cleanup

2. **Check Application Logs**

   - Browser console (F12)
   - Network tab for failed requests

3. **Rollback if needed**
   - Use backup to restore
   - File an issue with error details

---

## ✅ Post-Cleanup Tasks

After successful cleanup:

- [ ] Update database documentation
- [ ] Update ER diagrams (if any)
- [ ] Commit cleanup scripts to version control
- [ ] Monitor application for 24-48 hours
- [ ] Consider running VACUUM FULL to reclaim space
- [ ] Update team about schema changes

---

## 📚 Files Reference

### Analysis & Documentation

- `DATABASE_TABLES_ANALYSIS.md` - Comprehensive analysis report
- `DATABASE_CLEANUP_QUICK_REFERENCE.md` - This file

### SQL Scripts

- `database/SAFE_TABLE_CLEANUP.sql` - Phase 1 safe deletions
- `database/OPTIONAL_TABLE_CLEANUP_PHASE2.sql` - Phase 2 optional deletions
- `database/INVESTIGATE_UNCERTAIN_TABLES.sql` - Investigation queries

---

**Last Updated**: October 14, 2025  
**Version**: 1.0  
**Author**: Database Analysis Agent
