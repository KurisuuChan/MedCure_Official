import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useToast } from "../contexts/ToastContext";
import {
  Package,
  TrendingUp,
  TrendingDown,
  Calendar,
  User,
  Filter,
  Download,
  RefreshCw,
} from "lucide-react";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { LoadingSpinner } from "./ui/LoadingSpinner";

const StockMovementHistory = ({ productId = null }) => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: "month",
    movementType: "all",
    productId: productId,
  });
  const toast = useToast();

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("stock_movements")
        .select(
          `
          *,
          products:product_id (
            name,
            batch_number
          )
        `
        )
        .order("created_at", { ascending: false });

      // Apply filters
      if (filters.productId) {
        query = query.eq("product_id", filters.productId);
      }

      if (filters.movementType !== "all") {
        query = query.eq("movement_type", filters.movementType);
      }

      // Date range filter
      const now = new Date();
      let startDate;
      switch (filters.dateRange) {
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "quarter":
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = null;
      }

      if (startDate) {
        query = query.gte("created_at", startDate.toISOString());
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;
      setMovements(data || []);
    } catch (err) {
      console.error("Error fetching stock movements:", err);
      toast.error("Failed to load stock movement history");
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-PH");
  };

  const getMovementIcon = (type) => {
    switch (type) {
      case "stock_in":
      case "purchase":
        return <TrendingUp className="h-4 w-4 text-success" />;
      case "stock_out":
      case "sale":
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      case "adjustment":
        return <Package className="h-4 w-4 text-warning" />;
      default:
        return <Package className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getMovementBadge = (type) => {
    switch (type) {
      case "stock_in":
      case "purchase":
        return (
          <Badge variant="success" size="sm">
            Stock In
          </Badge>
        );
      case "stock_out":
      case "sale":
        return (
          <Badge variant="destructive" size="sm">
            Stock Out
          </Badge>
        );
      case "adjustment":
        return (
          <Badge variant="warning" size="sm">
            Adjustment
          </Badge>
        );
      default:
        return (
          <Badge variant="default" size="sm">
            {type}
          </Badge>
        );
    }
  };

  const exportMovements = () => {
    if (movements.length === 0) {
      toast.warning("No movements to export");
      return;
    }

    const csvContent = [
      "Date,Product,Batch Number,Movement Type,Quantity,Reason,Reference",
      ...movements.map((movement) =>
        [
          formatDate(movement.created_at),
          movement.products?.name || "Unknown Product",
          movement.products?.batch_number || "",
          movement.movement_type,
          movement.quantity,
          movement.reason || "",
          movement.reference_number || "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `stock_movements_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            Stock Movement History
          </h2>
          <p className="text-muted-foreground">
            Track all inventory changes and transactions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportMovements}
            disabled={movements.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMovements}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters:</span>
          </div>

          <select
            value={filters.dateRange}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, dateRange: e.target.value }))
            }
            className="px-3 py-1 text-sm border border-border rounded-md bg-background"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="all">All Time</option>
          </select>

          <select
            value={filters.movementType}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, movementType: e.target.value }))
            }
            className="px-3 py-1 text-sm border border-border rounded-md bg-background"
          >
            <option value="all">All Types</option>
            <option value="stock_in">Stock In</option>
            <option value="stock_out">Stock Out</option>
            <option value="sale">Sales</option>
            <option value="purchase">Purchases</option>
            <option value="adjustment">Adjustments</option>
          </select>
        </div>
      </Card>

      {/* Movements List */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <LoadingSpinner size="lg" />
          </div>
        ) : movements.length === 0 ? (
          <div className="text-center p-8">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No stock movements found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium">Date</th>
                  <th className="text-left p-4 font-medium">Product</th>
                  <th className="text-left p-4 font-medium">Type</th>
                  <th className="text-left p-4 font-medium">Quantity</th>
                  <th className="text-left p-4 font-medium">Reason</th>
                  <th className="text-left p-4 font-medium">Reference</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((movement) => (
                  <tr
                    key={movement.id}
                    className="border-t border-border hover:bg-muted/30"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">
                          {formatDate(movement.created_at)}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-sm">
                          {movement.products?.name || "Unknown Product"}
                        </p>
                        {movement.products?.batch_number && (
                          <p className="text-xs text-muted-foreground">
                            Batch: {movement.products.batch_number}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getMovementIcon(movement.movement_type)}
                        {getMovementBadge(movement.movement_type)}
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`font-medium ${
                          movement.movement_type === "stock_in" ||
                          movement.movement_type === "purchase"
                            ? "text-success"
                            : "text-destructive"
                        }`}
                      >
                        {movement.movement_type === "stock_in" ||
                        movement.movement_type === "purchase"
                          ? "+"
                          : "-"}
                        {Math.abs(movement.quantity)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-muted-foreground">
                        {movement.reason || "No reason specified"}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-muted-foreground">
                        {movement.reference_number || "-"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default StockMovementHistory;
