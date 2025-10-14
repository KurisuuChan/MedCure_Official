import { useState, useEffect } from "react";
import {
  Mail,
  CheckCircle,
  Loader,
  Save,
  Info,
  Clock,
  AlertCircle,
  Package,
  Calendar,
  Send,
  Activity,
  Zap,
  Heart,
  Users,
} from "lucide-react";
import { emailService } from "../../services/notifications/EmailService";
import { notificationService } from "../../services/notifications/NotificationService";
import { scheduledNotificationService } from "../../services/notifications/ScheduledNotificationService";
import { useSettings } from "../../contexts/SettingsContext";

function NotificationManagement({ showSuccess, showError, showInfo }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [runningHealthCheck, setRunningHealthCheck] = useState(false);
  const [healthCheckResult, setHealthCheckResult] = useState(null);
  const [emailServiceStatus, setEmailServiceStatus] = useState(null);
  const [selectedRecipient, setSelectedRecipient] = useState(
    "kurisuuuchannn@gmail.com"
  );
  const [customRecipient, setCustomRecipient] = useState("");
  const [testingEmail, setTestingEmail] = useState(false);
  const { settings: globalSettings, updateSettings } = useSettings();

  // Simplified notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    lowStockCheckInterval: 60, // minutes (default: 1 hour)
    expiringCheckInterval: 360, // minutes (default: 6 hours)
    emailAlertsEnabled: false,
    dailyEmailEnabled: false,
    dailyEmailTime: "09:00",
  });

  // Predefined recipient options
  const recipientOptions = [
    {
      value: "kurisuuuchannn@gmail.com",
      label: "👤 Your Email (kurisuuuchannn@gmail.com)",
    },
    { value: "manager@medcure.com", label: "👔 Manager Email" },
    { value: "staff@medcure.com", label: "👥 Staff Email" },
    { value: "custom", label: "✏️ Custom Email Address" },
  ];

  // Load settings and initialize services
  useEffect(() => {
    // Load settings from localStorage and global settings
    const savedSettings = localStorage.getItem("medcure-notification-settings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setNotificationSettings((prev) => ({ ...prev, ...parsed }));
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
    }

    // Override with global settings if available
    if (globalSettings.lowStockCheckInterval !== undefined) {
      setNotificationSettings((prev) => ({
        ...prev,
        lowStockCheckInterval: globalSettings.lowStockCheckInterval || 60,
        expiringCheckInterval: globalSettings.expiringCheckInterval || 360,
        emailAlertsEnabled: globalSettings.emailAlertsEnabled || false,
        dailyEmailEnabled: globalSettings.dailyEmailEnabled || false,
        dailyEmailTime: globalSettings.dailyEmailTime || "09:00",
      }));
    }

    // Initialize email service status
    const status = emailService.getStatus();
    setEmailServiceStatus(status);

    // Initialize scheduled notification service
    scheduledNotificationService.initialize();
  }, [globalSettings]);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // Save to localStorage (for immediate use by NotificationService)
      localStorage.setItem(
        "medcure-notification-settings",
        JSON.stringify(notificationSettings)
      );

      // Save to database via SettingsContext (for persistence across browsers)
      await updateSettings({
        lowStockCheckInterval: notificationSettings.lowStockCheckInterval,
        expiringCheckInterval: notificationSettings.expiringCheckInterval,
        emailAlertsEnabled: notificationSettings.emailAlertsEnabled,
      });

      setSaved(true);
      showSuccess(
        "Notification settings saved successfully! The system will use these intervals for checking inventory."
      );
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save settings:", err);
      showError("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // NEW: Comprehensive Health Check using NotificationService
  const runComprehensiveHealthCheck = async () => {
    setRunningHealthCheck(true);
    setHealthCheckResult(null);

    try {
      showInfo("🏥 Running comprehensive pharmacy health check...");

      // Initialize notification service if needed
      await notificationService.initialize();

      // Run the comprehensive health checks (force = true for manual runs)
      const result = await notificationService.runHealthChecks(true);

      setHealthCheckResult(result);

      if (result.success) {
        const stats = result.statistics;
        if (stats) {
          showSuccess(
            `✅ Health check completed! Scanned ${stats.total} products. ` +
              `Found ${stats.outOfStock} out of stock, ${stats.criticalLowStock} critical, ` +
              `${stats.lowStock} low stock, ${stats.expiringSoon} expiring soon. ` +
              `Created ${result.totalNotifications} notifications.`
          );
        } else {
          showSuccess(
            `✅ Health check completed! Created ${result.totalNotifications} notifications. ` +
              `Email alerts sent for critical issues via Resend.`
          );
        }
      } else if (result.skipped) {
        showInfo(`⏭️ Health check skipped: ${result.reason}`);
      } else {
        showError(`❌ Health check failed: ${result.error}`);
      }
    } catch (error) {
      console.error("Health check error:", error);
      showError("Failed to run health check. Please try again.");
      setHealthCheckResult({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setRunningHealthCheck(false);
    }
  };

  // Get current recipient (selected or custom)
  const getCurrentRecipient = () => {
    if (selectedRecipient === "custom") {
      return customRecipient;
    }
    return selectedRecipient;
  };

  // Test email functionality
  const testEmailAlert = async () => {
    setTestingEmail(true);
    try {
      const recipient = getCurrentRecipient();
      if (!recipient) {
        showError("Please select or enter a recipient email address");
        return;
      }

      // Initialize notification service
      await notificationService.initialize();

      // Run health check and send email
      const result = await notificationService.runHealthChecks(true);

      if (result.success) {
        // Send email to selected recipient
        await emailService.send({
          to: recipient,
          subject: `🧪 MedCure Test Email - Health Check Results`,
          html: `
            <h1>✅ MedCure Test Email</h1>
            <p><strong>Health Check Completed Successfully!</strong></p>
            <p>📊 <strong>Statistics:</strong></p>
            <ul>
              <li>Total Products: ${result.statistics?.total || 0}</li>
              <li>Out of Stock: ${result.statistics?.outOfStock || 0}</li>
              <li>Low Stock: ${result.statistics?.lowStock || 0}</li>
              <li>Expiring Soon: ${result.statistics?.expiringSoon || 0}</li>
            </ul>
            <p>🕐 <strong>Time:</strong> ${new Date().toLocaleString()}</p>
            <p>📧 <strong>Sent to:</strong> ${recipient}</p>
          `,
          text: `MedCure Test - Health check completed. Statistics: ${result.totalNotifications} notifications created.`,
        });

        showSuccess(
          `✅ Test email sent successfully to ${recipient}! Health check created ${result.totalNotifications} notifications.`
        );
      } else {
        showError(`❌ Health check failed: ${result.error}`);
      }
    } catch (error) {
      console.error("Test email error:", error);
      showError("Failed to send test email");
    } finally {
      setTestingEmail(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">
              Automatic Inventory Monitoring
            </h4>
            <p className="text-sm text-blue-700">
              Your system continuously monitors inventory and sends
              notifications for critical issues. Configure how often the system
              checks for problems below.
            </p>
          </div>
        </div>
      </div>

      {/* Notification Timing Settings */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center space-x-2">
          <Clock className="h-5 w-5 text-purple-600" />
          <span>Notification Check Frequency</span>
        </h3>

        <div className="space-y-6">
          {/* Low Stock Check Interval */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-3 mb-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Package className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">
                  Low Stock Checks
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  How often the system checks for products below their reorder
                  level
                </p>
                <div className="max-w-xs">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Check Every
                  </label>
                  <select
                    value={notificationSettings.lowStockCheckInterval}
                    onChange={(e) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        lowStockCheckInterval: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour (Recommended)</option>
                    <option value="120">2 hours</option>
                    <option value="360">6 hours</option>
                    <option value="720">12 hours</option>
                    <option value="1440">24 hours</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-2">
                    ⏱️ Current: Every{" "}
                    {notificationSettings.lowStockCheckInterval >= 60
                      ? `${Math.floor(
                          notificationSettings.lowStockCheckInterval / 60
                        )} hour${
                          Math.floor(
                            notificationSettings.lowStockCheckInterval / 60
                          ) > 1
                            ? "s"
                            : ""
                        }`
                      : `${notificationSettings.lowStockCheckInterval} minutes`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Expiring Products Check Interval */}
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start space-x-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar className="h-5 w-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">
                  Expiring Product Checks
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  How often the system checks for products approaching their
                  expiration date
                </p>
                <div className="max-w-xs">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Check Every
                  </label>
                  <select
                    value={notificationSettings.expiringCheckInterval}
                    onChange={(e) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        expiringCheckInterval: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    <option value="60">1 hour</option>
                    <option value="120">2 hours</option>
                    <option value="360">6 hours (Recommended)</option>
                    <option value="720">12 hours</option>
                    <option value="1440">24 hours</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-2">
                    ⏱️ Current: Every{" "}
                    {notificationSettings.expiringCheckInterval >= 60
                      ? `${Math.floor(
                          notificationSettings.expiringCheckInterval / 60
                        )} hour${
                          Math.floor(
                            notificationSettings.expiringCheckInterval / 60
                          ) > 1
                            ? "s"
                            : ""
                        }`
                      : `${notificationSettings.expiringCheckInterval} minutes`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Out of Stock - Always Immediate */}
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">
                  Out of Stock Alerts
                </h4>
                <p className="text-sm text-gray-600">
                  <strong>Always Immediate</strong> - Critical alerts when stock
                  reaches zero cannot be delayed
                </p>
                <div className="mt-2 inline-flex items-center px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                  🚨 Real-time monitoring (cannot be configured)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Optimization Tips */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2 flex items-center space-x-2">
            <Info className="h-4 w-4" />
            <span>Optimization Tips</span>
          </h4>
          <ul className="text-sm text-blue-700 space-y-1 ml-6 list-disc">
            <li>
              <strong>Frequent checks (15-30 min):</strong> Best for high-volume
              pharmacies with rapid stock changes
            </li>
            <li>
              <strong>Moderate checks (1-2 hours):</strong> Balanced approach
              for most pharmacies (recommended)
            </li>
            <li>
              <strong>Infrequent checks (6-24 hours):</strong> Suitable for
              slow-moving inventory or overnight monitoring
            </li>
          </ul>
        </div>
      </div>

      {/* Resend Email Service Status */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center space-x-2">
          <Zap className="h-5 w-5 text-green-600" />
          <span>Resend Email Service</span>
        </h3>

        {emailServiceStatus && (
          <div className="mb-6">
            <div
              className={`p-4 rounded-lg border ${
                emailServiceStatus.ready &&
                emailServiceStatus.provider === "resend"
                  ? "bg-green-50 border-green-200"
                  : "bg-yellow-50 border-yellow-200"
              }`}
            >
              <div className="flex items-start space-x-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    emailServiceStatus.ready &&
                    emailServiceStatus.provider === "resend"
                      ? "bg-green-100"
                      : "bg-yellow-100"
                  }`}
                >
                  {emailServiceStatus.ready &&
                  emailServiceStatus.provider === "resend" ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    {emailServiceStatus.ready &&
                    emailServiceStatus.provider === "resend"
                      ? "✅ Resend Integration Active"
                      : emailServiceStatus.provider === "formsubmit"
                      ? "⚠️ Using FormSubmit Fallback"
                      : "❌ Email Service Not Ready"}
                  </h4>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Provider:</strong> {emailServiceStatus.provider}{" "}
                    <br />
                    <strong>From:</strong> {emailServiceStatus.fromName} &lt;
                    {emailServiceStatus.fromEmail}&gt; <br />
                    <strong>Status:</strong>{" "}
                    {emailServiceStatus.ready ? "Ready" : "Not Ready"}
                  </p>
                  {emailServiceStatus.provider === "resend" && (
                    <div className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded">
                      🚀 Professional email delivery via Supabase Edge Function
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Comprehensive Health Check */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h4 className="font-semibold text-gray-900 mb-2 flex items-center space-x-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <span>Comprehensive Health Check</span>
          </h4>
          <p className="text-sm text-gray-600 mb-4">
            Run a complete pharmacy system health check that scans all products
            for stock issues, expiring items, and sends professional email
            alerts via Resend for critical problems.
          </p>

          {healthCheckResult && (
            <div
              className={`p-4 rounded-lg border mb-4 ${
                healthCheckResult.success
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <div className="flex items-start space-x-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    healthCheckResult.success ? "bg-green-100" : "bg-red-100"
                  }`}
                >
                  {healthCheckResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">
                    {healthCheckResult.success
                      ? healthCheckResult.forced
                        ? `✅ Manual Health Check Completed`
                        : `✅ Automatic Health Check Completed`
                      : healthCheckResult.skipped
                      ? `⏭️ Health Check Skipped`
                      : `❌ Health Check Failed`}
                  </h4>

                  {healthCheckResult.success && healthCheckResult.statistics ? (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 mb-2">
                        📊 <strong>Inventory Analysis:</strong> Scanned{" "}
                        {healthCheckResult.statistics.total} products
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-green-100 px-2 py-1 rounded">
                          ✅ Healthy: {healthCheckResult.statistics.healthy}
                        </div>
                        <div className="bg-yellow-100 px-2 py-1 rounded">
                          ⚠️ Low Stock: {healthCheckResult.statistics.lowStock}
                        </div>
                        <div className="bg-orange-100 px-2 py-1 rounded">
                          🔥 Critical:{" "}
                          {healthCheckResult.statistics.criticalLowStock}
                        </div>
                        <div className="bg-red-100 px-2 py-1 rounded">
                          ❌ Out of Stock:{" "}
                          {healthCheckResult.statistics.outOfStock}
                        </div>
                        {healthCheckResult.statistics.expiringSoon > 0 && (
                          <div className="bg-purple-100 px-2 py-1 rounded col-span-2">
                            📅 Expiring Soon (30 days):{" "}
                            {healthCheckResult.statistics.expiringSoon}
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-green-600 mt-2">
                        📧 Created{" "}
                        <strong>{healthCheckResult.totalNotifications}</strong>{" "}
                        new notifications
                        {healthCheckResult.totalNotifications > 0 &&
                          " • Email alerts sent via Resend"}
                      </p>
                    </div>
                  ) : healthCheckResult.success ? (
                    <p className="text-sm text-gray-600 mt-1">
                      Created {healthCheckResult.totalNotifications}{" "}
                      notifications. Email alerts sent for critical issues.
                    </p>
                  ) : healthCheckResult.skipped ? (
                    <p className="text-sm text-gray-600 mt-1">
                      Reason: {healthCheckResult.reason}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-600 mt-1">
                      Error: {healthCheckResult.error}
                    </p>
                  )}

                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(healthCheckResult.timestamp).toLocaleString()}
                    {healthCheckResult.forced && " • Manual Run"}
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={runComprehensiveHealthCheck}
            disabled={runningHealthCheck}
            className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {runningHealthCheck ? (
              <>
                <Loader className="h-5 w-5 animate-spin" />
                <span>Running Health Check...</span>
              </>
            ) : (
              <>
                <Heart className="h-5 w-5" />
                <span>Run Comprehensive Health Check</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Email Notifications - Simplified */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center space-x-2">
          <Mail className="h-5 w-5 text-blue-600" />
          <span>Email Notifications</span>
        </h3>

        <div className="space-y-6">
          {/* Email Toggle */}
          <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div>
              <h4 className="font-semibold text-gray-900">
                Enable Email Alerts
              </h4>
              <p className="text-sm text-gray-600">
                Send inventory alerts and health check reports via email
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.emailAlertsEnabled}
                onChange={(e) =>
                  setNotificationSettings({
                    ...notificationSettings,
                    emailAlertsEnabled: e.target.checked,
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {/* Email Recipient Selection */}
          {notificationSettings.emailAlertsEnabled && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Choose Email Recipient</span>
              </h4>

              <div className="space-y-3">
                {/* Recipient Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Send emails to:
                  </label>
                  <select
                    value={selectedRecipient}
                    onChange={(e) => setSelectedRecipient(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white"
                  >
                    {recipientOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Custom Email Input */}
                {selectedRecipient === "custom" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custom email address:
                    </label>
                    <input
                      type="email"
                      placeholder="Enter email address..."
                      value={customRecipient}
                      onChange={(e) => setCustomRecipient(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                )}

                {/* Current Recipient Display */}
                <div className="p-3 bg-white border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>Current recipient:</strong>{" "}
                    {getCurrentRecipient() || "Please enter an email address"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Daily Email Schedule */}
          {notificationSettings.emailAlertsEnabled && (
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">
                🕘 Daily Email Schedule
              </h4>

              <div className="space-y-3">
                {/* Enable Daily Emails */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Send daily reports
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.dailyEmailEnabled}
                      onChange={(e) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          dailyEmailEnabled: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {/* Time Selection */}
                {notificationSettings.dailyEmailEnabled && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Send daily report at:
                    </label>
                    <input
                      type="time"
                      value={notificationSettings.dailyEmailTime}
                      onChange={(e) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          dailyEmailTime: e.target.value,
                        })
                      }
                      className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      🕘 Daily emails will be sent at{" "}
                      {notificationSettings.dailyEmailTime} (
                      {new Date(
                        `2000-01-01 ${notificationSettings.dailyEmailTime}`
                      ).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                      )
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Test Email Button */}
          {notificationSettings.emailAlertsEnabled && getCurrentRecipient() && (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">
                🧪 Test Email System
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                Send a test email with health check results to verify everything
                is working.
              </p>
              <button
                onClick={testEmailAlert}
                disabled={testingEmail}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {testingEmail ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    <span>Sending Test Email...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    <span>Send Test Email to {getCurrentRecipient()}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end space-x-4 pt-4 border-t">
        {saved && (
          <div className="flex items-center space-x-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Settings saved!</span>
          </div>
        )}
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 shadow-lg"
        >
          {saving ? (
            <>
              <Loader className="h-5 w-5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              <span>Save Settings</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default NotificationManagement;
