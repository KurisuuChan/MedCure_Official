/**
 * ============================================================================
 * ScheduledNotificationService - Automated Daily Email Reports
 * ============================================================================
 *
 * Handles scheduled email notifications including:
 * - Daily 9 AM inventory reports
 * - Customizable scheduled health checks
 * - Automatic email delivery to multiple recipients
 *
 * @version 1.0.0
 * @date 2025-10-15
 */

import { emailService } from "./EmailService.js";
import { notificationService } from "./NotificationService.js";

class ScheduledNotificationService {
  constructor() {
    this.scheduledTasks = new Map();
    this.isInitialized = false;
    this.settings = {
      dailyEmailTime: "09:00", // 9:00 AM
      dailyEmailEnabled: false,
      dailyEmailRecipients: ["kurisuuuchannn@gmail.com"],
      timezone: "local", // Use local timezone
    };

    console.log("🕐 ScheduledNotificationService initialized");
  }

  /**
   * Initialize the scheduler with settings
   */
  async initialize() {
    if (this.isInitialized) {
      console.log("⏰ Scheduler already initialized");
      return;
    }

    try {
      // Load settings from localStorage
      const savedSettings = localStorage.getItem(
        "medcure-scheduled-notifications"
      );
      if (savedSettings) {
        this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
        console.log(
          "⚙️ Loaded scheduled notification settings:",
          this.settings
        );
      }

      // Start the daily email scheduler if enabled
      if (this.settings.dailyEmailEnabled) {
        this.startDailyEmailScheduler();
      }

      this.isInitialized = true;
      console.log("✅ ScheduledNotificationService initialized successfully");
    } catch (error) {
      console.error(
        "❌ Failed to initialize ScheduledNotificationService:",
        error
      );
      throw error;
    }
  }

  /**
   * Update scheduler settings
   */
  async updateSettings(newSettings) {
    try {
      const oldSettings = { ...this.settings };
      this.settings = { ...this.settings, ...newSettings };

      // Save to localStorage
      localStorage.setItem(
        "medcure-scheduled-notifications",
        JSON.stringify(this.settings)
      );

      console.log("⚙️ Updated scheduled notification settings:", this.settings);

      // Restart scheduler if daily email settings changed
      if (
        oldSettings.dailyEmailEnabled !== this.settings.dailyEmailEnabled ||
        oldSettings.dailyEmailTime !== this.settings.dailyEmailTime
      ) {
        this.stopDailyEmailScheduler();
        if (this.settings.dailyEmailEnabled) {
          this.startDailyEmailScheduler();
        }
      }

      return { success: true };
    } catch (error) {
      console.error(
        "❌ Failed to update scheduled notification settings:",
        error
      );
      throw error;
    }
  }

  /**
   * Start the daily email scheduler
   */
  startDailyEmailScheduler() {
    console.log(
      `🕘 Starting daily email scheduler for ${this.settings.dailyEmailTime}`
    );

    // Stop existing scheduler if running
    this.stopDailyEmailScheduler();

    // Parse the time setting (HH:MM format)
    const [hours, minutes] = this.settings.dailyEmailTime
      .split(":")
      .map(Number);

    // Calculate milliseconds until next occurrence
    const now = new Date();
    const target = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hours,
      minutes,
      0,
      0
    );

    // If target time has passed today, schedule for tomorrow
    if (target <= now) {
      target.setDate(target.getDate() + 1);
    }

    const timeUntilNext = target.getTime() - now.getTime();

    console.log(
      `⏰ Next daily email scheduled for: ${target.toLocaleString()}`
    );
    console.log(
      `⏱️ Time until next email: ${Math.round(
        timeUntilNext / 1000 / 60
      )} minutes`
    );

    // Set initial timeout
    const timeoutId = setTimeout(() => {
      this.sendDailyEmail();

      // Set up recurring daily interval (24 hours)
      const intervalId = setInterval(() => {
        this.sendDailyEmail();
      }, 24 * 60 * 60 * 1000);

      this.scheduledTasks.set("dailyEmailInterval", intervalId);
    }, timeUntilNext);

    this.scheduledTasks.set("dailyEmailTimeout", timeoutId);
  }

  /**
   * Stop the daily email scheduler
   */
  stopDailyEmailScheduler() {
    const timeoutId = this.scheduledTasks.get("dailyEmailTimeout");
    const intervalId = this.scheduledTasks.get("dailyEmailInterval");

    if (timeoutId) {
      clearTimeout(timeoutId);
      this.scheduledTasks.delete("dailyEmailTimeout");
      console.log("⏹️ Stopped daily email timeout");
    }

    if (intervalId) {
      clearInterval(intervalId);
      this.scheduledTasks.delete("dailyEmailInterval");
      console.log("⏹️ Stopped daily email interval");
    }
  }

  /**
   * Send the daily inventory email report
   */
  async sendDailyEmail() {
    try {
      console.log("📅 Sending daily email report...");

      if (!emailService.isReady()) {
        console.error("❌ Email service not ready for daily report");
        return { success: false, error: "Email service not configured" };
      }

      // Initialize notification service if needed
      await notificationService.initialize();

      // Run comprehensive health check to get current status
      const healthCheck = await notificationService.runHealthChecks();

      // Generate daily report email content
      const emailContent = this.generateDailyReportHTML(healthCheck);

      const currentDate = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      // Send to all configured recipients
      const result = await emailService.send({
        to: this.settings.dailyEmailRecipients,
        subject: `🏥 MedCure Daily Pharmacy Report - ${currentDate}`,
        html: emailContent,
        text: `Daily Pharmacy Report for ${currentDate}. Check your email for detailed inventory status.`,
      });

      if (result.success) {
        console.log(
          `✅ Daily email sent successfully to ${this.settings.dailyEmailRecipients.length} recipient(s)`
        );

        // Create a notification in the system
        await notificationService.createNotification({
          type: "info",
          title: "Daily Email Report Sent",
          message: `Daily pharmacy report sent to ${
            this.settings.dailyEmailRecipients.length
          } recipient(s) at ${new Date().toLocaleTimeString()}`,
          priority: "low",
          category: "system",
          metadata: {
            emailId: result.emailId,
            recipients: this.settings.dailyEmailRecipients,
            reportDate: new Date().toISOString(),
          },
        });

        return {
          success: true,
          emailId: result.emailId,
          recipients: this.settings.dailyEmailRecipients,
        };
      } else {
        console.error("❌ Failed to send daily email:", result);
        return { success: false, error: result.error || "Unknown error" };
      }
    } catch (error) {
      console.error("❌ Daily email error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate HTML content for daily report
   */
  generateDailyReportHTML(healthCheck) {
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const formattedTime = currentDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    let statusSummary = "";
    let alertsSection = "";
    let statusColor = "#10b981"; // Green for good status
    let statusIcon = "✅";

    if (healthCheck && healthCheck.success) {
      const stats = healthCheck.statistics || {};

      if (stats.outOfStock > 0 || stats.criticalLowStock > 0) {
        statusColor = "#ef4444"; // Red for critical issues
        statusIcon = "🚨";
        statusSummary = `Critical Issues Found: ${stats.outOfStock} out of stock, ${stats.criticalLowStock} critically low`;
      } else if (stats.lowStock > 0 || stats.expiringSoon > 0) {
        statusColor = "#f59e0b"; // Orange for warnings
        statusIcon = "⚠️";
        statusSummary = `Warnings: ${stats.lowStock} low stock, ${stats.expiringSoon} expiring soon`;
      } else {
        statusSummary = "All inventory levels are healthy";
      }

      // Generate alerts section
      if (healthCheck.totalNotifications > 0) {
        alertsSection = `
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <h3 style="color: #dc2626; margin-top: 0;">📋 Today's Alerts</h3>
            <p><strong>Total Notifications Created:</strong> ${
              healthCheck.totalNotifications
            }</p>
            <ul style="color: #374151;">
              ${
                stats.outOfStock > 0
                  ? `<li>🚨 <strong>${stats.outOfStock}</strong> products out of stock</li>`
                  : ""
              }
              ${
                stats.criticalLowStock > 0
                  ? `<li>🔴 <strong>${stats.criticalLowStock}</strong> products critically low</li>`
                  : ""
              }
              ${
                stats.lowStock > 0
                  ? `<li>🟡 <strong>${stats.lowStock}</strong> products below reorder level</li>`
                  : ""
              }
              ${
                stats.expiringSoon > 0
                  ? `<li>📅 <strong>${stats.expiringSoon}</strong> products expiring soon</li>`
                  : ""
              }
            </ul>
          </div>
        `;
      } else {
        alertsSection = `
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <h3 style="color: #059669; margin-top: 0;">✅ No Issues Found</h3>
            <p>All products are well-stocked and within expiry guidelines. Great job!</p>
          </div>
        `;
      }
    } else {
      statusColor = "#ef4444";
      statusIcon = "❌";
      statusSummary = "Unable to generate report - system error";
      alertsSection = `
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <h3 style="color: #dc2626; margin-top: 0;">❌ Report Generation Error</h3>
          <p>There was an issue generating today's report. Please check the system manually.</p>
          <p><strong>Error:</strong> ${
            healthCheck?.error || "Unknown error"
          }</p>
        </div>
      `;
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Daily Pharmacy Report</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, ${statusColor} 0%, #059669 100%); color: white; padding: 24px; text-align: center; border-radius: 12px; margin-bottom: 20px;">
          <h1 style="margin: 0; font-size: 28px;">🏥 MedCure Pharmacy</h1>
          <p style="margin: 8px 0 0; opacity: 0.9; font-size: 16px;">Daily Inventory Report</p>
          <p style="margin: 8px 0 0; opacity: 0.8; font-size: 14px;">${formattedDate} • ${formattedTime}</p>
        </div>

        <!-- Status Summary -->
        <div style="background: white; padding: 24px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: ${statusColor}; margin-top: 0; display: flex; align-items: center; gap: 8px;">
            <span>${statusIcon}</span> System Status
          </h2>
          <p style="font-size: 16px; color: #374151; margin: 12px 0;">${statusSummary}</p>
        </div>

        <!-- Alerts Section -->
        ${alertsSection}

        <!-- Quick Actions -->
        <div style="background: white; padding: 24px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h3 style="color: #059669; margin-top: 0;">🚀 Quick Actions</h3>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <a href="https://www.medcure-official.me/dashboard" style="display: block; padding: 12px; background: #f3f4f6; text-decoration: none; color: #374151; border-radius: 6px; font-weight: 500;">📊 View Dashboard</a>
            <a href="https://www.medcure-official.me/inventory" style="display: block; padding: 12px; background: #f3f4f6; text-decoration: none; color: #374151; border-radius: 6px; font-weight: 500;">📦 Manage Inventory</a>
            <a href="https://www.medcure-official.me/system-settings" style="display: block; padding: 12px; background: #f3f4f6; text-decoration: none; color: #374151; border-radius: 6px; font-weight: 500;">⚙️ Notification Settings</a>
          </div>
        </div>

        <!-- System Info -->
        <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
          <h4 style="color: #6b7280; margin-top: 0; font-size: 14px;">📋 Report Details</h4>
          <div style="font-size: 12px; color: #6b7280; line-height: 1.5;">
            <strong>Report Time:</strong> ${currentDate.toISOString()}<br>
            <strong>Email Service:</strong> ${emailService.getProvider()} (${
      emailService.isReady() ? "Ready" : "Not Ready"
    })<br>
            <strong>Recipients:</strong> ${this.settings.dailyEmailRecipients.join(
              ", "
            )}<br>
            <strong>Next Report:</strong> Tomorrow at ${
              this.settings.dailyEmailTime
            }
          </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding: 16px; color: #6b7280; font-size: 14px;">
          <p style="margin: 0;">This is an automated daily report from MedCure Pharmacy Management System</p>
          <p style="margin: 4px 0 0;">© ${currentDate.getFullYear()} MedCure Pharmacy • Powered by Resend</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Test the daily email functionality
   */
  async testDailyEmail() {
    console.log("🧪 Testing daily email functionality...");
    return await this.sendDailyEmail();
  }

  /**
   * Get current settings
   */
  getSettings() {
    return { ...this.settings };
  }

  /**
   * Get next scheduled email time
   */
  getNextEmailTime() {
    if (!this.settings.dailyEmailEnabled) {
      return null;
    }

    const [hours, minutes] = this.settings.dailyEmailTime
      .split(":")
      .map(Number);
    const now = new Date();
    const target = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hours,
      minutes,
      0,
      0
    );

    // If target time has passed today, schedule for tomorrow
    if (target <= now) {
      target.setDate(target.getDate() + 1);
    }

    return target;
  }

  /**
   * Add a recipient to daily emails
   */
  addRecipient(email) {
    if (!this.settings.dailyEmailRecipients.includes(email)) {
      this.settings.dailyEmailRecipients.push(email);
      localStorage.setItem(
        "medcure-scheduled-notifications",
        JSON.stringify(this.settings)
      );
      console.log(`➕ Added recipient: ${email}`);
      return true;
    }
    return false;
  }

  /**
   * Remove a recipient from daily emails
   */
  removeRecipient(email) {
    const index = this.settings.dailyEmailRecipients.indexOf(email);
    if (index > -1) {
      this.settings.dailyEmailRecipients.splice(index, 1);
      localStorage.setItem(
        "medcure-scheduled-notifications",
        JSON.stringify(this.settings)
      );
      console.log(`➖ Removed recipient: ${email}`);
      return true;
    }
    return false;
  }

  /**
   * Cleanup - stop all scheduled tasks
   */
  cleanup() {
    this.stopDailyEmailScheduler();
    console.log("🧹 ScheduledNotificationService cleaned up");
  }
}

// Export singleton instance
export const scheduledNotificationService = new ScheduledNotificationService();
export default scheduledNotificationService;
