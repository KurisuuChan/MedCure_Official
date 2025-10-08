// Simulate the actual role permissions and test

const ROLES = {
  ADMIN: "admin",
  PHARMACIST: "pharmacist",
  EMPLOYEE: "employee",
};

const PERMISSIONS = {
  CREATE_USERS: "create_users",
  EDIT_USERS: "edit_users",
  DELETE_USERS: "delete_users",
  VIEW_USERS: "view_users",
  MANAGE_ROLES: "manage_roles",
  CREATE_PRODUCTS: "create_products",
  EDIT_PRODUCTS: "edit_products",
  DELETE_PRODUCTS: "delete_products",
  VIEW_INVENTORY: "view_inventory",
  MANAGE_STOCK: "manage_stock",
  MANAGE_BATCHES: "manage_batches",
  PROCESS_SALES: "process_sales",
  HANDLE_RETURNS: "handle_returns",
  VOID_TRANSACTIONS: "void_transactions",
  VIEW_SALES_REPORTS: "view_sales_reports",
  MANAGE_DISCOUNTS: "manage_discounts",
  VIEW_TRANSACTION_HISTORY: "view_transaction_history",
  EXPORT_TRANSACTIONS: "export_transactions",
  REFUND_TRANSACTIONS: "refund_transactions",
  VIEW_ANALYTICS: "view_analytics",
  GENERATE_REPORTS: "generate_reports",
  EXPORT_REPORTS: "export_reports",
  VIEW_FINANCIAL_REPORTS: "view_financial_reports",
  VIEW_CUSTOMERS: "view_customers",
  MANAGE_CUSTOMERS: "manage_customers",
  VIEW_CUSTOMER_HISTORY: "view_customer_history",
  VIEW_SYSTEM_SETTINGS: "view_system_settings",
  MANAGE_SYSTEM_SETTINGS: "manage_system_settings",
  MANAGE_PRICING: "manage_pricing",
  CREATE_BACKUP: "create_backup",
  RESTORE_BACKUP: "restore_backup",
  VIEW_ACTIVITY_LOGS: "view_activity_logs",
  VIEW_AUDIT_TRAILS: "view_audit_trails",
};

const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
};

const hasPermission = (role, permission) => {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
};

console.log("Testing hasPermission function for ADMIN:\n");

const testPermissions = [
  "create_users",
  "manage_system_settings",
  "create_backup",
  "view_analytics",
  "manage_batches",
];

testPermissions.forEach((perm) => {
  const result = hasPermission(ROLES.ADMIN, perm);
  console.log(`  ${perm}: ${result ? "✅ HAS" : "❌ MISSING"}`);
});

console.log(
  `\nAdmin role permission array length: ${
    ROLE_PERMISSIONS[ROLES.ADMIN].length
  }`
);
console.log(
  "Admin has create_users:",
  ROLE_PERMISSIONS[ROLES.ADMIN].includes("create_users")
);
console.log(
  "Admin has manage_system_settings:",
  ROLE_PERMISSIONS[ROLES.ADMIN].includes("manage_system_settings")
);
