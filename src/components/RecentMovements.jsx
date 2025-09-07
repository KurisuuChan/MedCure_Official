import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

const RecentMovements = () => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);

  // Movement type configurations
  const movementTypes = {
    stock_in: {
      icon: "📈",
      color: "text-green-600 dark:text-green-400",
      label: "Stock In",
    },
    stock_out: {
      icon: "📉",
      color: "text-red-600 dark:text-red-400",
      label: "Stock Out",
    },
    sale: {
      icon: "💰",
      color: "text-blue-600 dark:text-blue-400",
      label: "Sale",
    },
    adjustment: {
      icon: "⚖️",
      color: "text-yellow-600 dark:text-yellow-400",
      label: "Adjustment",
    },
    expired: {
      icon: "❌",
      color: "text-gray-600 dark:text-gray-400",
      label: "Expired",
    },
    return: {
      icon: "↩️",
      color: "text-purple-600 dark:text-purple-400",
      label: "Return",
    },
  };

  // Fetch recent stock movements
  const fetchRecentMovements = useCallback(async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("stock_movements")
        .select(
          `
          *,
          products(name, unit)
        `
        )
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      setMovements(data || []);
    } catch (err) {
      console.error("Error fetching recent movements:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecentMovements();

    // Set up real-time subscription
    const movementsSubscription = supabase
      .channel("recent_movements")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "stock_movements",
        },
        () => {
          fetchRecentMovements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(movementsSubscription);
    };
  }, [fetchRecentMovements]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Recent Stock Movements
        </h3>
        <Link
          to="/movements"
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
        >
          View All →
        </Link>
      </div>

      <div className="space-y-3">
        {loading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        )}

        {!loading && movements.length === 0 && (
          <div className="text-center py-4">
            <div className="text-4xl mb-2">📋</div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              No recent movements
            </p>
          </div>
        )}

        {!loading &&
          movements.length > 0 &&
          movements.map((movement) => {
            const typeConfig = movementTypes[movement.movement_type] || {};
            return (
              <div
                key={movement.id}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center space-x-3">
                  <div className={`text-lg ${typeConfig.color}`}>
                    {typeConfig.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {movement.products?.name || "Unknown Product"}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {typeConfig.label} •{" "}
                      {new Date(movement.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-medium ${
                      movement.quantity_change > 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {movement.quantity_change > 0 ? "+" : ""}
                    {movement.quantity_change}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {movement.products?.unit || "units"}
                  </p>
                </div>
              </div>
            );
          })}
      </div>

      {movements.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Link
            to="/movements"
            className="block w-full text-center py-2 px-4 bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors text-sm font-medium"
          >
            View Full History
          </Link>
        </div>
      )}
    </div>
  );
};

export default RecentMovements;
