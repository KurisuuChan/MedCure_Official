import { supabase } from "../../../config/supabase";
import { AuthService } from "../auth/authService";

/**
 * Centralized Audit Log Service
 * Tracks all critical user actions across the system
 *
 * @description Professional audit trail system that records:
 * - Who performed the action (user info)
 * - What action was performed (type, details)
 * - When it happened (timestamp)
 * - Where it happened (IP address, user agent)
 * - Additional context (metadata)
 */

export class AuditLogService {
  /**
   * Activity types for comprehensive tracking
   */
  static ACTIVITY_TYPES = {
    // Sales & Transactions
    SALE_CREATED: "SALE_CREATED",
    SALE_VOIDED: "SALE_VOIDED",
    SALE_REFUNDED: "SALE_REFUNDED",
    PAYMENT_RECEIVED: "PAYMENT_RECEIVED",

    // Inventory Management
    PRODUCT_CREATED: "PRODUCT_CREATED",
    PRODUCT_UPDATED: "PRODUCT_UPDATED",
    PRODUCT_DELETED: "PRODUCT_DELETED",
    PRODUCT_ARCHIVED: "PRODUCT_ARCHIVED",
    PRODUCT_RESTORED: "PRODUCT_RESTORED",
    STOCK_ADJUSTED: "STOCK_ADJUSTED",
    STOCK_ADDED: "STOCK_ADDED",
    STOCK_REMOVED: "STOCK_REMOVED",

    // Batch Management
    BATCH_CREATED: "BATCH_CREATED",
    BATCH_UPDATED: "BATCH_UPDATED",
    BATCH_DELETED: "BATCH_DELETED",

    // Category Management
    CATEGORY_CREATED: "CATEGORY_CREATED",
    CATEGORY_UPDATED: "CATEGORY_UPDATED",
    CATEGORY_DELETED: "CATEGORY_DELETED",

    // Customer Management
    CUSTOMER_CREATED: "CUSTOMER_CREATED",
    CUSTOMER_UPDATED: "CUSTOMER_UPDATED",
    CUSTOMER_DELETED: "CUSTOMER_DELETED",

    // User Management
    USER_CREATED: "USER_CREATED",
    USER_UPDATED: "USER_UPDATED",
    USER_DEACTIVATED: "USER_DEACTIVATED",
    USER_ACTIVATED: "USER_ACTIVATED",
    PERMISSION_CHANGED: "PERMISSION_CHANGED",
    ROLE_CHANGED: "ROLE_CHANGED",

    // Authentication
    LOGIN_SUCCESS: "LOGIN_SUCCESS",
    LOGIN_FAILED: "LOGIN_FAILED",
    LOGOUT: "LOGOUT",
    PASSWORD_CHANGED: "PASSWORD_CHANGED",
    PASSWORD_RESET: "PASSWORD_RESET",

    // Reports & Analytics
    REPORT_GENERATED: "REPORT_GENERATED",
    REPORT_EXPORTED: "REPORT_EXPORTED",

    // System Configuration
    SETTINGS_CHANGED: "SETTINGS_CHANGED",
    NOTIFICATION_SENT: "NOTIFICATION_SENT",

    // CSV Import
    CSV_IMPORT_STARTED: "CSV_IMPORT_STARTED",
    CSV_IMPORT_COMPLETED: "CSV_IMPORT_COMPLETED",
    CSV_IMPORT_FAILED: "CSV_IMPORT_FAILED",
  };

  /**
   * Log an activity to the database
   *
   * @param {string} activityType - Type of activity (use ACTIVITY_TYPES constants)
   * @param {string} description - Human-readable description
   * @param {object} options - Additional options
   * @param {string} options.userId - User ID (auto-detected if not provided)
   * @param {object} options.metadata - Additional metadata to store
   * @param {string} options.entityType - Type of entity affected (e.g., 'product', 'sale')
   * @param {string} options.entityId - ID of the affected entity
   * @param {object} options.changes - Before/after values for updates
   * @returns {Promise<object>} Created activity log entry
   */
  static async log(activityType, description, options = {}) {
    try {
      // Get current user info
      const currentUser = await AuthService.getCurrentUser();
      const userId = options.userId || currentUser?.id;

      if (!userId) {
        console.warn(
          "⚠️ [AuditLog] No user ID available for logging activity:",
          activityType
        );
        // For system actions or when user is not logged in, we can still log with null user
      }

      // Get user details for the log
      let userDetails = null;
      if (userId) {
        const { data: user } = await supabase
          .from("users")
          .select("id, email, first_name, last_name, role")
          .eq("id", userId)
          .single();

        userDetails = user;
      }

      // Get IP address and user agent from browser
      const ipAddress = await this.getClientIP();
      const userAgent = navigator.userAgent;

      // Prepare activity log entry
      const activityLog = {
        user_id: userId,
        activity_type: activityType,
        description: description,
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: {
          ...options.metadata,
          entity_type: options.entityType,
          entity_id: options.entityId,
          changes: options.changes,
          timestamp_local: new Date().toISOString(),
          user_email: userDetails?.email,
          user_name: userDetails
            ? `${userDetails.first_name} ${userDetails.last_name}`
            : null,
          user_role: userDetails?.role,
        },
        created_at: new Date().toISOString(),
      };

      // Insert into database
      const { data, error } = await supabase
        .from("user_activity_logs")
        .insert(activityLog)
        .select()
        .single();

      if (error) {
        console.error("❌ [AuditLog] Failed to log activity:", error);
        throw error;
      }

      console.log(`✅ [AuditLog] Logged ${activityType}:`, description);
      return data;
    } catch (error) {
      console.error("❌ [AuditLog] Error logging activity:", error);
      // Don't throw - audit logging should not break the main functionality
      return null;
    }
  }

  /**
   * Get client IP address (best effort)
   * Note: In browser, this is limited. Consider using a backend endpoint for accurate IP
   */
  static async getClientIP() {
    try {
      // Try to get from a public IP service
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      return data.ip || "Unknown";
    } catch {
      return "Unknown";
    }
  }

  /**
   * Convenience methods for common actions
   */

  // Sales tracking
  static async logSaleCreated(saleId, saleData, userId) {
    return this.log(
      this.ACTIVITY_TYPES.SALE_CREATED,
      `Created sale #${saleId} - Total: ₱${
        saleData.total?.toFixed(2) || "0.00"
      }`,
      {
        userId,
        entityType: "sale",
        entityId: saleId,
        metadata: {
          total: saleData.total,
          items_count: saleData.items?.length || 0,
          customer_id: saleData.customer_id,
          payment_method: saleData.payment_method,
        },
      }
    );
  }

  static async logSaleVoided(saleId, reason, userId) {
    return this.log(
      this.ACTIVITY_TYPES.SALE_VOIDED,
      `Voided sale #${saleId} - Reason: ${reason}`,
      {
        userId,
        entityType: "sale",
        entityId: saleId,
        metadata: { reason },
      }
    );
  }

  static async logSaleRefunded(saleId, amount, reason, userId) {
    return this.log(
      this.ACTIVITY_TYPES.SALE_REFUNDED,
      `Refunded sale #${saleId} - Amount: ₱${amount.toFixed(2)}`,
      {
        userId,
        entityType: "sale",
        entityId: saleId,
        metadata: { amount, reason },
      }
    );
  }

  // Product tracking
  static async logProductCreated(productId, productName, userId) {
    return this.log(
      this.ACTIVITY_TYPES.PRODUCT_CREATED,
      `Added new product: ${productName}`,
      {
        userId,
        entityType: "product",
        entityId: productId,
        metadata: { product_name: productName },
      }
    );
  }

  static async logProductUpdated(productId, productName, changes, userId) {
    const changesSummary = Object.keys(changes).join(", ");
    return this.log(
      this.ACTIVITY_TYPES.PRODUCT_UPDATED,
      `Updated product: ${productName} (${changesSummary})`,
      {
        userId,
        entityType: "product",
        entityId: productId,
        changes,
        metadata: { product_name: productName },
      }
    );
  }

  static async logProductDeleted(productId, productName, userId) {
    return this.log(
      this.ACTIVITY_TYPES.PRODUCT_DELETED,
      `Deleted product: ${productName}`,
      {
        userId,
        entityType: "product",
        entityId: productId,
        metadata: { product_name: productName },
      }
    );
  }

  static async logProductArchived(productId, productName, userId) {
    return this.log(
      this.ACTIVITY_TYPES.PRODUCT_ARCHIVED,
      `Archived product: ${productName}`,
      {
        userId,
        entityType: "product",
        entityId: productId,
        metadata: { product_name: productName },
      }
    );
  }

  static async logStockAdjusted(
    productId,
    productName,
    oldStock,
    newStock,
    reason,
    userId
  ) {
    const difference = newStock - oldStock;
    const action = difference > 0 ? "increased" : "decreased";
    return this.log(
      this.ACTIVITY_TYPES.STOCK_ADJUSTED,
      `Stock ${action} for ${productName}: ${oldStock} → ${newStock} (${reason})`,
      {
        userId,
        entityType: "product",
        entityId: productId,
        changes: { stock_before: oldStock, stock_after: newStock },
        metadata: {
          product_name: productName,
          difference,
          reason,
        },
      }
    );
  }

  // Customer tracking
  static async logCustomerCreated(customerId, customerName, userId) {
    return this.log(
      this.ACTIVITY_TYPES.CUSTOMER_CREATED,
      `Added new customer: ${customerName}`,
      {
        userId,
        entityType: "customer",
        entityId: customerId,
        metadata: { customer_name: customerName },
      }
    );
  }

  static async logCustomerUpdated(customerId, customerName, changes, userId) {
    return this.log(
      this.ACTIVITY_TYPES.CUSTOMER_UPDATED,
      `Updated customer: ${customerName}`,
      {
        userId,
        entityType: "customer",
        entityId: customerId,
        changes,
        metadata: { customer_name: customerName },
      }
    );
  }

  static async logCustomerDeleted(customerId, customerName, userId) {
    return this.log(
      this.ACTIVITY_TYPES.CUSTOMER_DELETED,
      `Deleted customer: ${customerName}`,
      {
        userId,
        entityType: "customer",
        entityId: customerId,
        metadata: { customer_name: customerName },
      }
    );
  }

  // Category tracking
  static async logCategoryCreated(categoryId, categoryName, userId) {
    return this.log(
      this.ACTIVITY_TYPES.CATEGORY_CREATED,
      `Created category: ${categoryName}`,
      {
        userId,
        entityType: "category",
        entityId: categoryId,
        metadata: { category_name: categoryName },
      }
    );
  }

  static async logCategoryUpdated(categoryId, categoryName, changes, userId) {
    return this.log(
      this.ACTIVITY_TYPES.CATEGORY_UPDATED,
      `Updated category: ${categoryName}`,
      {
        userId,
        entityType: "category",
        entityId: categoryId,
        changes,
        metadata: { category_name: categoryName },
      }
    );
  }

  // CSV Import tracking
  static async logCSVImportStarted(fileName, recordCount, userId) {
    return this.log(
      this.ACTIVITY_TYPES.CSV_IMPORT_STARTED,
      `Started CSV import: ${fileName} (${recordCount} records)`,
      {
        userId,
        entityType: "csv_import",
        metadata: { file_name: fileName, record_count: recordCount },
      }
    );
  }

  static async logCSVImportCompleted(
    fileName,
    successCount,
    failCount,
    userId
  ) {
    return this.log(
      this.ACTIVITY_TYPES.CSV_IMPORT_COMPLETED,
      `Completed CSV import: ${fileName} (${successCount} success, ${failCount} failed)`,
      {
        userId,
        entityType: "csv_import",
        metadata: {
          file_name: fileName,
          success_count: successCount,
          fail_count: failCount,
        },
      }
    );
  }

  // Report tracking
  static async logReportGenerated(reportType, reportName, userId) {
    return this.log(
      this.ACTIVITY_TYPES.REPORT_GENERATED,
      `Generated ${reportType} report: ${reportName}`,
      {
        userId,
        entityType: "report",
        metadata: { report_type: reportType, report_name: reportName },
      }
    );
  }

  static async logReportExported(reportType, format, userId) {
    return this.log(
      this.ACTIVITY_TYPES.REPORT_EXPORTED,
      `Exported ${reportType} report as ${format}`,
      {
        userId,
        entityType: "report",
        metadata: { report_type: reportType, export_format: format },
      }
    );
  }

  // Settings tracking
  static async logSettingsChanged(settingName, oldValue, newValue, userId) {
    return this.log(
      this.ACTIVITY_TYPES.SETTINGS_CHANGED,
      `Changed setting: ${settingName}`,
      {
        userId,
        entityType: "settings",
        changes: { [settingName]: { old: oldValue, new: newValue } },
        metadata: { setting_name: settingName },
      }
    );
  }

  /**
   * Query activity logs with filters
   *
   * @param {object} filters - Filter options
   * @param {string} filters.userId - Filter by user ID
   * @param {string} filters.activityType - Filter by activity type
   * @param {string} filters.entityType - Filter by entity type
   * @param {string} filters.entityId - Filter by entity ID
   * @param {Date} filters.startDate - Filter by start date
   * @param {Date} filters.endDate - Filter by end date
   * @param {number} filters.limit - Limit results (default: 100)
   * @returns {Promise<Array>} Activity logs
   */
  static async getActivityLogs(filters = {}) {
    try {
      let query = supabase
        .from("user_activity_logs")
        .select(
          `
          *,
          user:users(id, email, first_name, last_name, role)
        `
        )
        .order("created_at", { ascending: false });

      // Apply filters
      if (filters.userId) {
        query = query.eq("user_id", filters.userId);
      }

      if (filters.activityType) {
        query = query.eq("activity_type", filters.activityType);
      }

      if (filters.entityType) {
        query = query.eq("metadata->>entity_type", filters.entityType);
      }

      if (filters.entityId) {
        query = query.eq("metadata->>entity_id", filters.entityId);
      }

      if (filters.startDate) {
        query = query.gte("created_at", filters.startDate.toISOString());
      }

      if (filters.endDate) {
        query = query.lte("created_at", filters.endDate.toISOString());
      }

      // Limit results
      const limit = filters.limit || 100;
      query = query.limit(limit);

      const { data, error } = await query;

      if (error) {
        console.error("❌ [AuditLog] Failed to query activity logs:", error);
        throw error;
      }

      // Enrich activity logs with user info if not already present
      const enrichedData = data.map((log) => ({
        ...log,
        user_name:
          log.metadata?.user_name ||
          (log.user
            ? `${log.user.first_name} ${log.user.last_name}`
            : "System"),
        user_email: log.metadata?.user_email || log.user?.email || "N/A",
        user_role: log.metadata?.user_role || log.user?.role || "N/A",
      }));

      return enrichedData;
    } catch (error) {
      console.error("❌ [AuditLog] Error querying activity logs:", error);
      throw error;
    }
  }

  /**
   * Get activity logs for a specific entity
   *
   * @param {string} entityType - Entity type (e.g., 'product', 'sale')
   * @param {string} entityId - Entity ID
   * @param {number} limit - Limit results
   * @returns {Promise<Array>} Activity logs for the entity
   */
  static async getEntityHistory(entityType, entityId, limit = 50) {
    return this.getActivityLogs({
      entityType,
      entityId,
      limit,
    });
  }

  /**
   * Get recent activity for a user
   *
   * @param {string} userId - User ID
   * @param {number} limit - Limit results
   * @returns {Promise<Array>} Recent activity logs for the user
   */
  static async getUserActivity(userId, limit = 50) {
    return this.getActivityLogs({
      userId,
      limit,
    });
  }

  /**
   * Get activity statistics
   *
   * @param {object} filters - Filter options (same as getActivityLogs)
   * @returns {Promise<object>} Statistics about activities
   */
  static async getActivityStatistics(filters = {}) {
    try {
      const logs = await this.getActivityLogs({ ...filters, limit: 10000 });

      const stats = {
        total: logs.length,
        by_type: {},
        by_user: {},
        by_entity: {},
        by_hour: {},
        by_day: {},
        success_rate: 0,
      };

      logs.forEach((log) => {
        // Count by type
        stats.by_type[log.activity_type] =
          (stats.by_type[log.activity_type] || 0) + 1;

        // Count by user
        const userName = log.user_name || "System";
        stats.by_user[userName] = (stats.by_user[userName] || 0) + 1;

        // Count by entity
        const entityType = log.metadata?.entity_type || "N/A";
        stats.by_entity[entityType] = (stats.by_entity[entityType] || 0) + 1;

        // Count by hour
        const hour = new Date(log.created_at).getHours();
        stats.by_hour[hour] = (stats.by_hour[hour] || 0) + 1;

        // Count by day
        const day = new Date(log.created_at).toLocaleDateString();
        stats.by_day[day] = (stats.by_day[day] || 0) + 1;
      });

      // Calculate success rate (if metadata has success field)
      const logsWithStatus = logs.filter(
        (log) => log.metadata?.success !== undefined
      );
      if (logsWithStatus.length > 0) {
        const successCount = logsWithStatus.filter(
          (log) => log.metadata.success === true
        ).length;
        stats.success_rate = (successCount / logsWithStatus.length) * 100;
      }

      return stats;
    } catch (error) {
      console.error("❌ [AuditLog] Error getting statistics:", error);
      throw error;
    }
  }
}

export default AuditLogService;
