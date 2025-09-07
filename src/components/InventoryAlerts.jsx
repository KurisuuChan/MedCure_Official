import React, { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../lib/supabase";
import { useToast } from "../contexts/ToastContext";

const InventoryAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [alertSettings, setAlertSettings] = useState({
    lowStockThreshold: 10,
    expiryWarningDays: 30,
    reorderPoint: 5,
    enableNotifications: true,
    enableEmailAlerts: false,
  });
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { toast } = useToast();

  // Alert types and their priorities - memoized to prevent unnecessary re-renders
  const alertTypes = useMemo(
    () => ({
      out_of_stock: {
        icon: "🚨",
        color: "bg-red-500",
        priority: 1,
        label: "Out of Stock",
      },
      low_stock: {
        icon: "⚠️",
        color: "bg-orange-500",
        priority: 2,
        label: "Low Stock",
      },
      expiring_soon: {
        icon: "📅",
        color: "bg-yellow-500",
        priority: 3,
        label: "Expiring Soon",
      },
      expired: {
        icon: "❌",
        color: "bg-red-600",
        priority: 1,
        label: "Expired",
      },
      reorder_needed: {
        icon: "🔄",
        color: "bg-blue-500",
        priority: 2,
        label: "Reorder Needed",
      },
    }),
    []
  );

  // Fetch current alert settings
  const fetchAlertSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("alert_settings")
        .select("*")
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setAlertSettings((prev) => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.error("Error fetching alert settings:", err);
    }
  }, []);

  // Generate alerts based on current inventory
  const generateAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const alertList = [];

      // Fetch all products with current stock
      const { data: products, error } = await supabase
        .from("products")
        .select("*")
        .order("name");

      if (error) throw error;

      const currentDate = new Date();

      products.forEach((product) => {
        // Out of stock check
        if (product.quantity === 0) {
          alertList.push({
            id: `out_of_stock_${product.id}`,
            type: "out_of_stock",
            productId: product.id,
            productName: product.name,
            message: `${product.name} is completely out of stock`,
            severity: "critical",
            quantity: product.quantity,
            createdAt: new Date(),
          });
        }
        // Low stock check
        else if (product.quantity <= alertSettings.lowStockThreshold) {
          alertList.push({
            id: `low_stock_${product.id}`,
            type: "low_stock",
            productId: product.id,
            productName: product.name,
            message: `${product.name} is running low (${product.quantity} units remaining)`,
            severity: "warning",
            quantity: product.quantity,
            createdAt: new Date(),
          });
        }

        // Reorder point check
        if (product.quantity <= alertSettings.reorderPoint) {
          alertList.push({
            id: `reorder_needed_${product.id}`,
            type: "reorder_needed",
            productId: product.id,
            productName: product.name,
            message: `${product.name} has reached reorder point (${product.quantity} units)`,
            severity: "info",
            quantity: product.quantity,
            createdAt: new Date(),
          });
        }

        // Expiry checks
        if (product.expiry_date) {
          const expiryDate = new Date(product.expiry_date);
          const daysToExpiry = Math.ceil(
            (expiryDate - currentDate) / (1000 * 60 * 60 * 24)
          );

          if (daysToExpiry < 0) {
            // Expired
            alertList.push({
              id: `expired_${product.id}`,
              type: "expired",
              productId: product.id,
              productName: product.name,
              message: `${product.name} expired ${Math.abs(
                daysToExpiry
              )} days ago`,
              severity: "critical",
              quantity: product.quantity,
              daysToExpiry,
              createdAt: new Date(),
            });
          } else if (daysToExpiry <= alertSettings.expiryWarningDays) {
            // Expiring soon
            alertList.push({
              id: `expiring_soon_${product.id}`,
              type: "expiring_soon",
              productId: product.id,
              productName: product.name,
              message: `${product.name} expires in ${daysToExpiry} days`,
              severity: "warning",
              quantity: product.quantity,
              daysToExpiry,
              createdAt: new Date(),
            });
          }
        }
      });

      // Sort alerts by priority and date
      alertList.sort((a, b) => {
        const priorityA = alertTypes[a.type]?.priority || 999;
        const priorityB = alertTypes[b.type]?.priority || 999;
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      setAlerts(alertList);

      // Store alerts in database for persistence
      if (alertList.length > 0) {
        const { error: insertError } = await supabase
          .from("inventory_alerts")
          .upsert(
            alertList.map((alert) => ({
              alert_id: alert.id,
              product_id: alert.productId,
              alert_type: alert.type,
              message: alert.message,
              severity: alert.severity,
              is_read: false,
              created_at: alert.createdAt.toISOString(),
            })),
            { onConflict: "alert_id" }
          );

        if (insertError) {
          console.error("Error storing alerts:", insertError);
        }
      }
    } catch (err) {
      console.error("Error generating alerts:", err);
      toast.error("Failed to generate inventory alerts");
    } finally {
      setLoading(false);
    }
  }, [alertSettings, alertTypes, toast]);

  // Save alert settings
  const saveAlertSettings = async () => {
    try {
      const { error } = await supabase.from("alert_settings").upsert({
        id: 1, // Single settings record
        ...alertSettings,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast.success("Alert settings saved successfully");
      setShowSettings(false);

      // Regenerate alerts with new settings
      generateAlerts();
    } catch (err) {
      console.error("Error saving alert settings:", err);
      toast.error("Failed to save alert settings");
    }
  };

  // Mark alert as read
  const markAsRead = async (alertId) => {
    try {
      const { error } = await supabase
        .from("inventory_alerts")
        .update({ is_read: true })
        .eq("alert_id", alertId);

      if (error) throw error;

      setAlerts((prev) =>
        prev.map((alert) =>
          alert.id === alertId ? { ...alert, isRead: true } : alert
        )
      );
    } catch (err) {
      console.error("Error marking alert as read:", err);
    }
  };

  // Dismiss alert
  const dismissAlert = (alertId) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
  };

  // Clear all alerts
  const clearAllAlerts = async () => {
    try {
      const { error } = await supabase
        .from("inventory_alerts")
        .update({ is_read: true })
        .in(
          "alert_id",
          alerts.map((alert) => alert.id)
        );

      if (error) throw error;

      setAlerts([]);
      toast.success("All alerts cleared");
    } catch (err) {
      console.error("Error clearing alerts:", err);
      toast.error("Failed to clear alerts");
    }
  };

  // Auto-refresh alerts
  useEffect(() => {
    fetchAlertSettings();
  }, [fetchAlertSettings]);

  useEffect(() => {
    if (alertSettings.enableNotifications) {
      generateAlerts();

      // Set up auto-refresh every 5 minutes
      const interval = setInterval(generateAlerts, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [alertSettings.enableNotifications, generateAlerts]);

  // Get alert statistics
  const alertStats = {
    total: alerts.length,
    critical: alerts.filter((a) => a.severity === "critical").length,
    warning: alerts.filter((a) => a.severity === "warning").length,
    info: alerts.filter((a) => a.severity === "info").length,
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Inventory Alerts
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor critical inventory conditions and receive automated
            notifications
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            ⚙️ Settings
          </button>
          <button
            onClick={generateAlerts}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "🔄 Refreshing..." : "🔄 Refresh Alerts"}
          </button>
          {alerts.length > 0 && (
            <button
              onClick={clearAllAlerts}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              ✓ Clear All
            </button>
          )}
        </div>
      </div>

      {/* Alert Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Alerts
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {alertStats.total}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <span className="text-2xl">🔔</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Critical
              </p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {alertStats.critical}
              </p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
              <span className="text-2xl">🚨</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Warnings
              </p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {alertStats.warning}
              </p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
              <span className="text-2xl">⚠️</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Info</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {alertStats.info}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <span className="text-2xl">ℹ️</span>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Settings Panel */}
      {showSettings && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Alert Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Low Stock Threshold
              </label>
              <input
                type="number"
                value={alertSettings.lowStockThreshold}
                onChange={(e) =>
                  setAlertSettings((prev) => ({
                    ...prev,
                    lowStockThreshold: parseInt(e.target.value) || 0,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Expiry Warning (Days)
              </label>
              <input
                type="number"
                value={alertSettings.expiryWarningDays}
                onChange={(e) =>
                  setAlertSettings((prev) => ({
                    ...prev,
                    expiryWarningDays: parseInt(e.target.value) || 0,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reorder Point
              </label>
              <input
                type="number"
                value={alertSettings.reorderPoint}
                onChange={(e) =>
                  setAlertSettings((prev) => ({
                    ...prev,
                    reorderPoint: parseInt(e.target.value) || 0,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                min="0"
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={alertSettings.enableNotifications}
                  onChange={(e) =>
                    setAlertSettings((prev) => ({
                      ...prev,
                      enableNotifications: e.target.checked,
                    }))
                  }
                  className="mr-2 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Enable Notifications
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={alertSettings.enableEmailAlerts}
                  onChange={(e) =>
                    setAlertSettings((prev) => ({
                      ...prev,
                      enableEmailAlerts: e.target.checked,
                    }))
                  }
                  className="mr-2 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Enable Email Alerts
                </span>
              </label>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={saveAlertSettings}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save Settings
            </button>
          </div>
        </div>
      )}

      {/* Alerts List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Active Alerts ({alerts.length})
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Loading alerts...
            </p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Active Alerts
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              All inventory levels are within normal parameters
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {alerts.map((alert) => {
              const alertConfig = alertTypes[alert.type] || {};
              return (
                <div
                  key={alert.id}
                  className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    alert.isRead ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div
                        className={`flex-shrink-0 w-8 h-8 ${alertConfig.color} rounded-full flex items-center justify-center text-white text-sm`}
                      >
                        {alertConfig.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              alert.severity === "critical"
                                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                : alert.severity === "warning"
                                ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            }`}
                          >
                            {alertConfig.label}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(alert.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white font-medium">
                          {alert.productName}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {alert.message}
                        </p>
                        <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>Quantity: {alert.quantity}</span>
                          {alert.daysToExpiry !== undefined && (
                            <span>
                              {alert.daysToExpiry < 0
                                ? "Expired"
                                : `${alert.daysToExpiry} days to expiry`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!alert.isRead && (
                        <button
                          onClick={() => markAsRead(alert.id)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                        >
                          Mark Read
                        </button>
                      )}
                      <button
                        onClick={() => dismissAlert(alert.id)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryAlerts;
