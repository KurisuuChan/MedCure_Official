// Count permissions in UI categories

const permissionCategories = {
  "User Management": [
    "create_users",
    "edit_users",
    "delete_users",
    "view_users",
    "manage_roles",
  ],
  "Inventory Management": [
    "create_products",
    "edit_products",
    "delete_products",
    "view_inventory",
    "manage_stock",
    "manage_batches",
  ],
  "Sales & POS": [
    "process_sales",
    "handle_returns",
    "void_transactions",
    "view_sales_reports",
    "manage_discounts",
  ],
  "Transaction History": [
    "view_transaction_history",
    "export_transactions",
    "refund_transactions",
  ],
  "Analytics & Reports": [
    "view_analytics",
    "generate_reports",
    "export_reports",
    "view_financial_reports",
  ],
  "Customer Management": [
    "view_customers",
    "manage_customers",
    "view_customer_history",
  ],
  "System Settings": [
    "view_system_settings",
    "manage_system_settings",
    "manage_pricing",
  ],
  "Backup & Security": [
    "create_backup",
    "restore_backup",
    "view_activity_logs",
    "view_audit_trails",
  ],
};

let total = 0;
console.log("Permissions per category:");
for (const [category, permissions] of Object.entries(permissionCategories)) {
  console.log(`  ${category}: ${permissions.length}`);
  total += permissions.length;
}
console.log(`\nTotal permissions in UI: ${total}`);
console.log("Expected permissions: 33");
console.log("Match:", total === 33 ? "✅ YES" : "❌ NO - MISSING PERMISSIONS!");
