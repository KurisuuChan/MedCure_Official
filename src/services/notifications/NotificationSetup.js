/**
 * ============================================================================
 * MEDCURE NOTIFICATION SYSTEM - RESEND INTEGRATION SETUP
 * ============================================================================
 *
 * This file demonstrates how to use the MedCure notification system
 * with Resend email integration for your pharmacy management system.
 */

import { notificationService } from "../src/services/notifications/NotificationService.js";

/**
 * Initialize and test the notification system
 */
export async function setupNotificationSystem() {
  console.log("🏥 [MedCure] Initializing notification system...");

  try {
    // Initialize the notification service
    await notificationService.initialize();
    console.log("✅ Notification service initialized successfully");

    // Test email configuration
    const emailStatus = notificationService.emailService.getStatus();
    console.log("📧 Email service status:", emailStatus);

    if (emailStatus.ready && emailStatus.provider === "resend") {
      console.log("🚀 Resend integration is active and ready!");
      console.log(
        `📨 From: ${emailStatus.fromName} <${emailStatus.fromEmail}>`
      );
    }

    return true;
  } catch (error) {
    console.error("❌ Failed to initialize notification system:", error);
    return false;
  }
}

/**
 * Example: Send test notifications for different scenarios
 */
export async function sendTestNotifications(userId = "test-user-id") {
  console.log("🧪 [MedCure] Sending test notifications...");

  try {
    // Test 1: Low Stock Alert (will send email)
    const lowStockResult = await notificationService.notifyLowStock(
      "product-001",
      "Paracetamol 500mg Tablets",
      5, // current stock
      20, // reorder level
      userId
    );
    console.log(
      "📦 Low stock notification:",
      lowStockResult ? "Created" : "Skipped (duplicate)"
    );

    // Test 2: Critical Stock Alert (will send email)
    const criticalResult = await notificationService.notifyCriticalStock(
      "product-002",
      "Insulin Injection Pen",
      2, // critically low
      userId
    );
    console.log(
      "🚨 Critical stock notification:",
      criticalResult ? "Created" : "Skipped (duplicate)"
    );

    // Test 3: Out of Stock Alert (will send email)
    const outOfStockResult = await notificationService.notifyOutOfStock(
      "product-003",
      "Amoxicillin 250mg Capsules",
      userId
    );
    console.log(
      "❌ Out of stock notification:",
      outOfStockResult ? "Created" : "Skipped (duplicate)"
    );

    // Test 4: Product Expiring Soon (will send email)
    const expiringResult = await notificationService.notifyExpiringSoon(
      "product-004",
      "Antibiotics Batch #A123",
      "2025-10-21", // expires soon
      7, // days remaining
      userId
    );
    console.log(
      "📅 Expiring product notification:",
      expiringResult ? "Created" : "Skipped (duplicate)"
    );

    // Test 5: Sale Completed (in-app only, no email)
    const saleResult = await notificationService.notifySaleCompleted(
      "sale-001",
      125.5, // total amount
      3, // item count
      userId
    );
    console.log(
      "✅ Sale completed notification:",
      saleResult ? "Created" : "Skipped (duplicate)"
    );

    console.log("🎉 Test notifications completed! Check your email inbox.");
    return true;
  } catch (error) {
    console.error("❌ Failed to send test notifications:", error);
    return false;
  }
}

/**
 * Example: Run health checks to detect actual pharmacy issues
 */
export async function runPharmacyHealthCheck() {
  console.log("🏥 [MedCure] Running pharmacy health check...");

  try {
    const result = await notificationService.runHealthChecks();

    if (result.success) {
      console.log(`✅ Health check completed successfully!`);
      console.log(`📧 Notifications created: ${result.totalNotifications}`);
      console.log(`👤 Primary user: ${result.primaryUser}`);
    } else {
      console.log(`❌ Health check failed: ${result.error}`);
    }

    return result;
  } catch (error) {
    console.error("❌ Health check error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Example: Subscribe to real-time notifications
 */
export function subscribeToNotifications(userId, onUpdate = null) {
  console.log("📡 [MedCure] Subscribing to real-time notifications...");

  const defaultHandler = (payload) => {
    console.log("📬 New notification received:", {
      type: payload.eventType,
      title: payload.new?.title,
      category: payload.new?.category,
      priority: payload.new?.priority,
    });
  };

  const unsubscribe = notificationService.subscribeToNotifications(
    userId,
    onUpdate || defaultHandler
  );

  console.log(
    "✅ Subscribed to notifications. Call returned function to unsubscribe."
  );
  return unsubscribe;
}

/**
 * Example: Get current notification count and list
 */
export async function getNotificationSummary(userId) {
  console.log("📊 [MedCure] Getting notification summary...");

  try {
    // Get unread count
    const unreadCount = await notificationService.getUnreadCount(userId);

    // Get recent notifications
    const { notifications, totalCount } =
      await notificationService.getUserNotifications(userId, {
        limit: 10,
        unreadOnly: false,
      });

    console.log(`📬 Notification Summary:`);
    console.log(`   • Unread: ${unreadCount}`);
    console.log(`   • Total: ${totalCount}`);
    console.log(`   • Recent: ${notifications.length}`);

    return {
      unreadCount,
      totalCount,
      recent: notifications,
    };
  } catch (error) {
    console.error("❌ Failed to get notification summary:", error);
    return null;
  }
}

// ============================================================================
// USAGE EXAMPLES FOR YOUR PHARMACY SYSTEM
// ============================================================================

/*

// 1. Initialize on app startup
await setupNotificationSystem();

// 2. Subscribe to live updates (in your main component)
const unsubscribe = subscribeToNotifications('your-user-id', (notification) => {
  // Update UI, show toast, play sound, etc.
  console.log('New notification:', notification);
});

// 3. Trigger notifications when inventory changes
await notificationService.notifyLowStock(
  productId, 
  productName, 
  currentStock, 
  reorderLevel, 
  userId
);

// 4. Run automated health checks (every 15 minutes)
setInterval(async () => {
  await runPharmacyHealthCheck();
}, 15 * 60 * 1000);

// 5. Manual testing
await sendTestNotifications('your-user-id');

*/
