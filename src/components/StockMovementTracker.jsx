import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Package,
  AlertTriangle,
  Clock,
  User,
  FileText,
  Filter,
  Calendar,
  ArrowUpDown,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { supabase } from "../lib/supabase";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Badge } from "./ui/Badge";
import { LoadingSpinner } from "./ui/LoadingSpinner";

export const StockMovementTracker = ({ productId = null, className = "" }) => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });
  const [summary, setSummary] = useState([]);
  const { user } = useAuth();
  const toast = useToast();

  useEffect(() => {
    fetchMovements();
    fetchSummary();
  }, [productId, filter, dateRange]);

  const fetchMovements = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("stock_movements")
        .select(
          `
          *,
          product:products(name, batch_number),
          user:users(name, email)
        `
        )
        .order("created_at", { ascending: false })
        .gte("created_at", dateRange.start + "T00:00:00")
        .lte("created_at", dateRange.end + "T23:59:59");

      if (productId) {
        query = query.eq("product_id", productId);
      }

      if (filter !== "all") {
        query = query.eq("movement_type", filter);
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;
      setMovements(data || []);
    } catch (err) {
      console.error("Error fetching stock movements:", err);
      toast.error("Failed to load stock movements");
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const { data, error } = await supabase.rpc("get_stock_movement_summary", {
        product_id_param: productId,
        start_date: dateRange.start,
        end_date: dateRange.end,
      });

      if (error) throw error;
      setSummary(data || []);
    } catch (err) {
      console.error("Error fetching movement summary:", err);
    }
  };

  const addStockMovement = async (movementData) => {
    try {
      const { error } = await supabase.from("stock_movements").insert([
        {
          ...movementData,
          user_id: user.id,
        },
      ]);

      if (error) throw error;

      toast.success("Stock movement logged successfully");
      fetchMovements();
      fetchSummary();
    } catch (err) {
      console.error("Error adding stock movement:", err);
      toast.error("Failed to log stock movement");
    }
  };

  const getMovementIcon = (type) => {
    const icons = {
      in: TrendingUp,
      out: TrendingDown,
      adjustment: RotateCcw,
      transfer: ArrowUpDown,
      return: RotateCcw,
      damage: AlertTriangle,
      expired: Clock,
    };
    return icons[type] || Package;
  };

  const getMovementColor = (type) => {
    const colors = {
      in: "text-green-600 dark:text-green-400",
      out: "text-red-600 dark:text-red-400",
      adjustment: "text-blue-600 dark:text-blue-400",
      transfer: "text-purple-600 dark:text-purple-400",
      return: "text-orange-600 dark:text-orange-400",
      damage: "text-red-700 dark:text-red-500",
      expired: "text-gray-600 dark:text-gray-400",
    };
    return colors[type] || "text-gray-600 dark:text-gray-400";
  };

  const getMovementBadgeVariant = (type) => {
    const variants = {
      in: "success",
      out: "destructive",
      adjustment: "default",
      transfer: "secondary",
      return: "warning",
      damage: "destructive",
      expired: "secondary",
    };
    return variants[type] || "default";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatQuantityChange = (movement) => {
    const change = movement.quantity_changed;
    const sign = change > 0 ? "+" : "";
    return `${sign}${change}`;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Summary Cards */}
      {summary.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {summary.map((item) => {
            const Icon = getMovementIcon(item.movement_type);
            const color = getMovementColor(item.movement_type);

            return (
              <Card key={item.movement_type} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground capitalize">
                      {item.movement_type.replace("_", " ")}
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {item.total_quantity}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.total_transactions} transactions
                    </p>
                  </div>
                  <Icon className={`h-8 w-8 ${color}`} />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-1 text-sm border border-border rounded-md bg-background text-foreground"
            >
              <option value="all">All Types</option>
              <option value="in">Stock In</option>
              <option value="out">Stock Out</option>
              <option value="adjustment">Adjustments</option>
              <option value="transfer">Transfers</option>
              <option value="return">Returns</option>
              <option value="damage">Damaged</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, start: e.target.value }))
              }
              className="text-sm"
            />
            <span className="text-muted-foreground">to</span>
            <Input
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, end: e.target.value }))
              }
              className="text-sm"
            />
          </div>

          <Button onClick={fetchMovements} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </Card>

      {/* Movement History */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Stock Movement History
          </h3>
          <p className="text-sm text-muted-foreground">
            Showing {movements.length} movements
          </p>
        </div>

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
                  <th className="text-left p-4 font-medium text-foreground">
                    Date & Time
                  </th>
                  <th className="text-left p-4 font-medium text-foreground">
                    Product
                  </th>
                  <th className="text-left p-4 font-medium text-foreground">
                    Type
                  </th>
                  <th className="text-left p-4 font-medium text-foreground">
                    Quantity Change
                  </th>
                  <th className="text-left p-4 font-medium text-foreground">
                    Stock Level
                  </th>
                  <th className="text-left p-4 font-medium text-foreground">
                    User
                  </th>
                  <th className="text-left p-4 font-medium text-foreground">
                    Reference
                  </th>
                  <th className="text-left p-4 font-medium text-foreground">
                    Reason
                  </th>
                </tr>
              </thead>
              <tbody>
                {movements.map((movement) => {
                  const Icon = getMovementIcon(movement.movement_type);
                  const color = getMovementColor(movement.movement_type);

                  return (
                    <tr
                      key={movement.id}
                      className="border-t border-border hover:bg-muted/30"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm text-foreground">
                            {formatDate(movement.created_at)}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-foreground">
                            {movement.product?.name || "Unknown Product"}
                          </p>
                          {movement.batch_number && (
                            <p className="text-xs text-muted-foreground">
                              Batch: {movement.batch_number}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge
                          variant={getMovementBadgeVariant(
                            movement.movement_type
                          )}
                          className="flex items-center gap-1 w-fit"
                        >
                          <Icon className="h-3 w-3" />
                          {movement.movement_type.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <span className={`font-medium ${color}`}>
                          {formatQuantityChange(movement)}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <span className="text-muted-foreground">
                            {movement.quantity_before} →
                          </span>
                          <span className="font-medium text-foreground ml-1">
                            {movement.quantity_after}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm text-foreground">
                            {movement.user?.name || "Unknown User"}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-foreground">
                          {movement.reference_number || "-"}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-muted-foreground">
                          {movement.reason || "-"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
