import React, { useState, useEffect } from "react";
import { notificationService } from "../../services/notifications/NotificationService.js";
import emailService from "../../services/notifications/EmailService.js";

/**
 * Resend Integration Test Panel
 * Tests the complete email notification system with Resend
 */
export default function ResendTestPanel() {
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [emailConfig, setEmailConfig] = useState(null);

  useEffect(() => {
    // Get email service configuration
    const config = emailService.getStatus();
    setEmailConfig(config);
  }, []);

  const addResult = (message, type = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults((prev) => [
      ...prev,
      {
        id: Date.now(),
        message,
        type,
        timestamp,
      },
    ]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const testEmailService = async () => {
    setIsRunning(true);
    addResult("🧪 Testing Resend email service...", "info");

    try {
      const testEmail = "kurisuuuchannn@gmail.com";
      const result = await emailService.testConfiguration(testEmail);

      if (result.success) {
        addResult(
          `✅ Email sent successfully via ${result.provider}!`,
          "success"
        );
        addResult(`📧 Check ${testEmail} for the test email`, "info");
      } else {
        addResult(`❌ Email failed: ${result.message}`, "error");
      }
    } catch (error) {
      addResult(`❌ Test error: ${error.message}`, "error");
    }

    setIsRunning(false);
  };

  const testLowStockNotification = async () => {
    setIsRunning(true);
    addResult("📦 Testing low stock notification...", "info");

    try {
      // Use a test user ID - in real app, get from auth context
      const userId = "test-user-123";

      const result = await notificationService.notifyLowStock(
        "test-product-resend",
        "Paracetamol 500mg (Resend Test)",
        3, // current stock
        15, // reorder level
        userId
      );

      if (result) {
        addResult(
          "✅ Low stock notification created and email sent!",
          "success"
        );
        addResult("📧 Check your email for the alert", "info");
      } else {
        addResult("ℹ️ Notification skipped (duplicate prevention)", "warning");
      }
    } catch (error) {
      addResult(`❌ Notification error: ${error.message}`, "error");
    }

    setIsRunning(false);
  };

  const testCriticalStockNotification = async () => {
    setIsRunning(true);
    addResult("🚨 Testing critical stock notification...", "info");

    try {
      const userId = "test-user-123";

      const result = await notificationService.notifyCriticalStock(
        "test-product-critical",
        "Insulin Injection (Critical Test)",
        1, // critically low
        userId
      );

      if (result) {
        addResult(
          "✅ Critical stock notification created and email sent!",
          "success"
        );
        addResult("🚨 This should trigger an immediate email alert", "info");
      } else {
        addResult("ℹ️ Notification skipped (duplicate prevention)", "warning");
      }
    } catch (error) {
      addResult(`❌ Critical notification error: ${error.message}`, "error");
    }

    setIsRunning(false);
  };

  const runHealthCheck = async () => {
    setIsRunning(true);
    addResult("🏥 Running pharmacy health check...", "info");

    try {
      const result = await notificationService.runHealthChecks();

      if (result.success) {
        addResult(`✅ Health check completed successfully!`, "success");
        addResult(
          `📊 Created ${result.totalNotifications} notifications`,
          "info"
        );
        if (result.totalNotifications > 0) {
          addResult(
            "📧 Email alerts have been sent for critical issues",
            "info"
          );
        }
      } else {
        addResult(`❌ Health check failed: ${result.error}`, "error");
      }
    } catch (error) {
      addResult(`❌ Health check error: ${error.message}`, "error");
    }

    setIsRunning(false);
  };

  const getResultIcon = (type) => {
    switch (type) {
      case "success":
        return "✅";
      case "error":
        return "❌";
      case "warning":
        return "⚠️";
      default:
        return "ℹ️";
    }
  };

  const getResultColor = (type) => {
    switch (type) {
      case "success":
        return "text-green-600";
      case "error":
        return "text-red-600";
      case "warning":
        return "text-yellow-600";
      default:
        return "text-blue-600";
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          🚀 Resend Email Integration Test Panel
        </h3>
        <p className="text-gray-600">
          Test your professional email notification system powered by Resend
        </p>
      </div>

      {/* Email Configuration Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-700 mb-2">
          📧 Email Configuration
        </h4>
        {emailConfig && (
          <div className="space-y-1 text-sm">
            <div>
              <span className="font-medium">Provider:</span>{" "}
              <span
                className={
                  emailConfig.provider === "resend"
                    ? "text-green-600 font-semibold"
                    : "text-gray-600"
                }
              >
                {emailConfig.provider}
              </span>
            </div>
            <div>
              <span className="font-medium">Status:</span>{" "}
              <span
                className={
                  emailConfig.ready ? "text-green-600" : "text-red-600"
                }
              >
                {emailConfig.ready ? "✅ Ready" : "❌ Not Ready"}
              </span>
            </div>
            <div>
              <span className="font-medium">From:</span> {emailConfig.fromName}{" "}
              &lt;{emailConfig.fromEmail}&gt;
            </div>
          </div>
        )}
      </div>

      {/* Test Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={testEmailService}
          disabled={isRunning}
          className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isRunning ? "🔄 Testing..." : "📧 Test Email Service"}
        </button>

        <button
          onClick={testLowStockNotification}
          disabled={isRunning}
          className="px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isRunning ? "🔄 Creating..." : "📦 Test Low Stock Alert"}
        </button>

        <button
          onClick={testCriticalStockNotification}
          disabled={isRunning}
          className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isRunning ? "🔄 Creating..." : "🚨 Test Critical Alert"}
        </button>

        <button
          onClick={runHealthCheck}
          disabled={isRunning}
          className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isRunning ? "🔄 Checking..." : "🏥 Run Health Check"}
        </button>
      </div>

      {/* Clear Results */}
      {testResults.length > 0 && (
        <div className="mb-4">
          <button
            onClick={clearResults}
            className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            🗑️ Clear Results
          </button>
        </div>
      )}

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
          <div className="mb-2 text-gray-400">📊 Test Results:</div>
          {testResults.map((result) => (
            <div
              key={result.id}
              className={`mb-1 ${getResultColor(result.type)}`}
            >
              <span className="text-gray-500">[{result.timestamp}]</span>{" "}
              <span>{getResultIcon(result.type)}</span> {result.message}
            </div>
          ))}
        </div>
      )}

      {/* Usage Instructions */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">📋 How to Use</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>
            <strong>📧 Test Email Service:</strong> Sends a direct test email
            via Resend
          </li>
          <li>
            <strong>📦 Test Low Stock Alert:</strong> Creates low stock
            notification + email
          </li>
          <li>
            <strong>🚨 Test Critical Alert:</strong> Creates critical stock
            alert + urgent email
          </li>
          <li>
            <strong>🏥 Run Health Check:</strong> Scans all products and sends
            real alerts
          </li>
        </ul>
        <p className="text-xs text-blue-600 mt-2">
          ✉️ All email tests will be sent to: kurisuuuchannn@gmail.com
        </p>
      </div>
    </div>
  );
}
