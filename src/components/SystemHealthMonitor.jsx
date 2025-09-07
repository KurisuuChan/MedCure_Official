import React, { useState, useEffect } from "react";
import {
  Activity,
  Cpu,
  Database,
  Wifi,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export const SystemHealthMonitor = () => {
  const [healthStatus, setHealthStatus] = useState({
    database: "checking",
    realtime: "checking",
    authentication: "checking",
    lastUpdate: null,
  });

  const [systemMetrics, setSystemMetrics] = useState({
    responseTime: 0,
    uptime: 0,
    totalSales: 0,
    activeUsers: 0,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const performHealthCheck = async () => {
    const startTime = Date.now();
    const newStatus = {
      database: "checking",
      realtime: "checking",
      authentication: "checking",
      lastUpdate: null,
    };

    try {
      // Test database connection
      const { error } = await supabase
        .from("products")
        .select("count")
        .limit(1);
      newStatus.database = error ? "error" : "healthy";

      // Test authentication
      const { data: authData } = await supabase.auth.getSession();
      newStatus.authentication = authData?.session ? "healthy" : "warning";

      // Test realtime connection (if available)
      const realtimeStatus = supabase.realtime.isConnected();
      newStatus.realtime = realtimeStatus ? "healthy" : "warning";

      // Calculate response time
      const responseTime = Date.now() - startTime;

      // Get system metrics
      const today = new Date().toISOString().split("T")[0];
      const { data: salesData } = await supabase
        .from("sales")
        .select("count")
        .gte("created_at", today);

      setSystemMetrics((prev) => ({
        ...prev,
        responseTime,
        totalSales: salesData?.length || 0,
        uptime: Math.floor(
          (Date.now() - (performance.timeOrigin || Date.now())) / 1000
        ),
      }));

      newStatus.lastUpdate = new Date().toISOString();
      setHealthStatus(newStatus);
    } catch (error) {
      console.error("Health check failed:", error);
      setHealthStatus((prev) => ({
        ...prev,
        database: "error",
        lastUpdate: new Date().toISOString(),
      }));
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await performHealthCheck();
    setIsRefreshing(false);
  };

  useEffect(() => {
    performHealthCheck();
    const interval = setInterval(performHealthCheck, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "error":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-400 animate-pulse" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "healthy":
        return "text-green-600 bg-green-50";
      case "warning":
        return "text-yellow-600 bg-yellow-50";
      case "error":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const formatUptime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <Activity className="w-5 h-5 mr-2" />
          System Health
        </h3>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center disabled:opacity-50"
        >
          <Clock
            className={`w-4 h-4 mr-1 ${isRefreshing ? "animate-spin" : ""}`}
          />
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Health Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div
          className={`p-3 rounded-lg border ${getStatusColor(
            healthStatus.database
          )}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Database className="w-4 h-4 mr-2" />
              <span className="font-medium">Database</span>
            </div>
            {getStatusIcon(healthStatus.database)}
          </div>
          <p className="text-sm mt-1 capitalize">{healthStatus.database}</p>
        </div>

        <div
          className={`p-3 rounded-lg border ${getStatusColor(
            healthStatus.authentication
          )}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Wifi className="w-4 h-4 mr-2" />
              <span className="font-medium">Auth</span>
            </div>
            {getStatusIcon(healthStatus.authentication)}
          </div>
          <p className="text-sm mt-1 capitalize">
            {healthStatus.authentication}
          </p>
        </div>

        <div
          className={`p-3 rounded-lg border ${getStatusColor(
            healthStatus.realtime
          )}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Cpu className="w-4 h-4 mr-2" />
              <span className="font-medium">Realtime</span>
            </div>
            {getStatusIcon(healthStatus.realtime)}
          </div>
          <p className="text-sm mt-1 capitalize">{healthStatus.realtime}</p>
        </div>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {systemMetrics.responseTime}ms
          </div>
          <div className="text-sm text-gray-600">Response Time</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {formatUptime(systemMetrics.uptime)}
          </div>
          <div className="text-sm text-gray-600">Session Time</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {systemMetrics.totalSales}
          </div>
          <div className="text-sm text-gray-600">Today's Sales</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">1</div>
          <div className="text-sm text-gray-600">Active Users</div>
        </div>
      </div>

      {healthStatus.lastUpdate && (
        <div className="mt-4 text-xs text-gray-500 text-center">
          Last updated: {new Date(healthStatus.lastUpdate).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};
