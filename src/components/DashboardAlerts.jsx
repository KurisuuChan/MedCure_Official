import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

const DashboardAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [alertStats, setAlertStats] = useState({
    critical: 0,
    warning: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(false);

  // Alert type configurations
  const alertTypes = {
    out_of_stock: {
      icon: "🚨",
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-100 dark:bg-red-900",
      label: "Out of Stock",
    },
    low_stock: {
      icon: "⚠️",
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-100 dark:bg-orange-900",
      label: "Low Stock",
    },
    expiring_soon: {
      icon: "📅",
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-100 dark:bg-yellow-900",
      label: "Expiring Soon",
    },
    expired: {
      icon: "❌",
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-100 dark:bg-red-900",
      label: "Expired",
    },
    reorder_needed: {
      icon: "🔄",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900",
      label: "Reorder Needed",
    },
  };

  // Fetch recent alerts for dashboard
  const fetchDashboardAlerts = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch top 5 most critical alerts
      const { data: alertsData, error: alertsError } = await supabase
        .from("inventory_alerts")
        .select(
          `
          *,
          products(name)
        `
        )
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(5);

      if (alertsError) throw alertsError;

      // Calculate alert statistics
      const { data: statsData, error: statsError } = await supabase
        .from("inventory_alerts")
        .select("severity")
        .eq("is_read", false);

      if (statsError) throw statsError;

      const stats = {
        critical: statsData.filter((alert) => alert.severity === "critical")
          .length,
        warning: statsData.filter((alert) => alert.severity === "warning")
          .length,
        total: statsData.length,
      };

      setAlerts(alertsData || []);
      setAlertStats(stats);
    } catch (err) {
      console.error("Error fetching dashboard alerts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardAlerts();

    // Set up real-time subscription for alerts
    const alertsSubscription = supabase
      .channel("dashboard_alerts")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "inventory_alerts",
        },
        () => {
          fetchDashboardAlerts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(alertsSubscription);
    };
  }, [fetchDashboardAlerts]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Inventory Alerts
        </h3>
        <Link
          to="/alerts"
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
        >
          View All →
        </Link>
      </div>

      {/* Alert Statistics */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {alertStats.critical}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Critical
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {alertStats.warning}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Warning
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {alertStats.total}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Total</div>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="space-y-3">
        {loading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        )}

        {!loading && alerts.length === 0 && (
          <div className="text-center py-4">
            <div className="text-4xl mb-2">✅</div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              No active alerts
            </p>
          </div>
        )}

        {!loading &&
          alerts.length > 0 &&
          alerts.map((alert) => {
            const alertConfig = alertTypes[alert.alert_type] || {};
            return (
              <div
                key={alert.id}
                className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className={`text-lg ${alertConfig.color}`}>
                  {alertConfig.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {alert.products?.name || "Unknown Product"}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                    {alert.message}
                  </p>
                </div>
                <div
                  className={`px-2 py-1 rounded-full text-xs font-medium ${alertConfig.bgColor} ${alertConfig.color}`}
                >
                  {alertConfig.label}
                </div>
              </div>
            );
          })}
      </div>

      {alerts.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Link
            to="/alerts"
            className="block w-full text-center py-2 px-4 bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors text-sm font-medium"
          >
            Manage All Alerts
          </Link>
        </div>
      )}
    </div>
  );
};

export default DashboardAlerts;
