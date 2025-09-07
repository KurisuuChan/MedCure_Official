import { useState, useEffect, useMemo } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  AlertTriangle,
  Calendar,
  Users,
  ShoppingCart,
  PieChart,
  LineChart,
  Target,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { supabase } from "../lib/supabase";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { LoadingSpinner } from "./ui/LoadingSpinner";
import { Badge } from "./ui/Badge";

export const AnalyticsDashboard = ({ className = "" }) => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30d");
  const [analyticsData, setAnalyticsData] = useState({
    revenue: {},
    inventory: {},
    sales: {},
    movements: {},
    prescriptions: {},
    trends: {},
  });
  const { user } = useAuth();
  const toast = useToast();

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      const endDate = new Date();
      const startDate = new Date();

      // Calculate start date based on time range
      switch (timeRange) {
        case "7d":
          startDate.setDate(endDate.getDate() - 7);
          break;
        case "30d":
          startDate.setDate(endDate.getDate() - 30);
          break;
        case "90d":
          startDate.setDate(endDate.getDate() - 90);
          break;
        case "1y":
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      // Fetch various analytics data
      const [
        revenueData,
        inventoryData,
        salesData,
        movementData,
        prescriptionData,
        trendsData,
      ] = await Promise.all([
        fetchRevenueAnalytics(startDate, endDate),
        fetchInventoryAnalytics(),
        fetchSalesAnalytics(startDate, endDate),
        fetchMovementAnalytics(startDate, endDate),
        fetchPrescriptionAnalytics(startDate, endDate),
        fetchTrendsAnalytics(startDate, endDate),
      ]);

      setAnalyticsData({
        revenue: revenueData,
        inventory: inventoryData,
        sales: salesData,
        movements: movementData,
        prescriptions: prescriptionData,
        trends: trendsData,
      });
    } catch (err) {
      console.error("Error fetching analytics:", err);
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenueAnalytics = async (startDate, endDate) => {
    try {
      // Mock revenue data - replace with actual POS/sales data
      const { data: salesData } = await supabase
        .from("prescriptions")
        .select("total_amount, created_at")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());

      const totalRevenue =
        salesData?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) ||
        0;
      const avgDailyRevenue =
        totalRevenue /
        Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));

      return {
        total: totalRevenue,
        avgDaily: avgDailyRevenue,
        transactions: salesData?.length || 0,
        avgPerTransaction: salesData?.length
          ? totalRevenue / salesData.length
          : 0,
      };
    } catch (err) {
      console.error("Error fetching revenue analytics:", err);
      return { total: 0, avgDaily: 0, transactions: 0, avgPerTransaction: 0 };
    }
  };

  const fetchInventoryAnalytics = async () => {
    try {
      const { data: products } = await supabase
        .from("products")
        .select(
          "stock_quantity, min_stock_level, selling_price, cost_price, expiry_date"
        );

      if (!products) return {};

      const totalProducts = products.length;
      const lowStockItems = products.filter(
        (p) => p.stock_quantity <= p.min_stock_level
      ).length;
      const expiredItems = products.filter(
        (p) => new Date(p.expiry_date) <= new Date()
      ).length;
      const expiringSoonItems = products.filter((p) => {
        const expiry = new Date(p.expiry_date);
        const today = new Date();
        const daysDiff = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
        return daysDiff > 0 && daysDiff <= 30;
      }).length;

      const totalValue = products.reduce(
        (sum, p) => sum + p.selling_price * p.stock_quantity,
        0
      );
      const totalCost = products.reduce(
        (sum, p) => sum + p.cost_price * p.stock_quantity,
        0
      );

      return {
        totalProducts,
        lowStockItems,
        expiredItems,
        expiringSoonItems,
        totalValue,
        totalCost,
        profitMargin:
          totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0,
      };
    } catch (err) {
      console.error("Error fetching inventory analytics:", err);
      return {};
    }
  };

  const fetchSalesAnalytics = async (startDate, endDate) => {
    try {
      const { data: prescriptions } = await supabase
        .from("prescriptions")
        .select(
          "*, prescription_items(quantity_dispensed, unit_price, product:products(name, category_id, categories(name)))"
        )
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());

      if (!prescriptions) return {};

      // Top selling products
      const productSales = {};
      prescriptions.forEach((prescription) => {
        prescription.prescription_items?.forEach((item) => {
          const productName = item.product?.name || "Unknown";
          if (!productSales[productName]) {
            productSales[productName] = { quantity: 0, revenue: 0 };
          }
          productSales[productName].quantity += item.quantity_dispensed || 0;
          productSales[productName].revenue +=
            (item.quantity_dispensed || 0) * (item.unit_price || 0);
        });
      });

      const topProducts = Object.entries(productSales)
        .sort(([, a], [, b]) => b.quantity - a.quantity)
        .slice(0, 10)
        .map(([name, data]) => ({ name, ...data }));

      // Sales by category
      const categorySales = {};
      prescriptions.forEach((prescription) => {
        prescription.prescription_items?.forEach((item) => {
          const categoryName =
            item.product?.categories?.name || "Uncategorized";
          if (!categorySales[categoryName]) {
            categorySales[categoryName] = { quantity: 0, revenue: 0 };
          }
          categorySales[categoryName].quantity += item.quantity_dispensed || 0;
          categorySales[categoryName].revenue +=
            (item.quantity_dispensed || 0) * (item.unit_price || 0);
        });
      });

      return {
        topProducts,
        categorySales: Object.entries(categorySales).map(([name, data]) => ({
          name,
          ...data,
        })),
        totalTransactions: prescriptions.length,
      };
    } catch (err) {
      console.error("Error fetching sales analytics:", err);
      return {};
    }
  };

  const fetchMovementAnalytics = async (startDate, endDate) => {
    try {
      const { data: movements } = await supabase
        .from("stock_movements")
        .select("movement_type, quantity_changed, created_at")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());

      if (!movements) return {};

      const movementTypes = {};
      movements.forEach((movement) => {
        if (!movementTypes[movement.movement_type]) {
          movementTypes[movement.movement_type] = {
            count: 0,
            totalQuantity: 0,
          };
        }
        movementTypes[movement.movement_type].count++;
        movementTypes[movement.movement_type].totalQuantity += Math.abs(
          movement.quantity_changed
        );
      });

      return {
        byType: movementTypes,
        totalMovements: movements.length,
      };
    } catch (err) {
      console.error("Error fetching movement analytics:", err);
      return {};
    }
  };

  const fetchPrescriptionAnalytics = async (startDate, endDate) => {
    try {
      const { data: prescriptions } = await supabase
        .from("prescriptions")
        .select("status, created_at, total_amount")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());

      if (!prescriptions) return {};

      const statusCounts = {};
      prescriptions.forEach((prescription) => {
        if (!statusCounts[prescription.status]) {
          statusCounts[prescription.status] = 0;
        }
        statusCounts[prescription.status]++;
      });

      return {
        byStatus: statusCounts,
        total: prescriptions.length,
        avgValue:
          prescriptions.length > 0
            ? prescriptions.reduce((sum, p) => sum + (p.total_amount || 0), 0) /
              prescriptions.length
            : 0,
      };
    } catch (err) {
      console.error("Error fetching prescription analytics:", err);
      return {};
    }
  };

  const fetchTrendsAnalytics = async (startDate, endDate) => {
    try {
      // Calculate daily trends
      const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      const dailyData = [];

      for (let i = 0; i < days; i++) {
        const day = new Date(startDate);
        day.setDate(startDate.getDate() + i);

        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);

        // Get data for this day
        const { data: dailyPrescriptions } = await supabase
          .from("prescriptions")
          .select("total_amount")
          .gte("created_at", dayStart.toISOString())
          .lte("created_at", dayEnd.toISOString());

        const { data: dailyMovements } = await supabase
          .from("stock_movements")
          .select("id")
          .gte("created_at", dayStart.toISOString())
          .lte("created_at", dayEnd.toISOString());

        dailyData.push({
          date: day.toISOString().split("T")[0],
          revenue:
            dailyPrescriptions?.reduce(
              (sum, p) => sum + (p.total_amount || 0),
              0
            ) || 0,
          transactions: dailyPrescriptions?.length || 0,
          movements: dailyMovements?.length || 0,
        });
      }

      return { daily: dailyData };
    } catch (err) {
      console.error("Error fetching trends analytics:", err);
      return {};
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount || 0);
  };

  const formatPercentage = (value) => {
    return `${(value || 0).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground">
            Business intelligence and performance metrics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <Button onClick={fetchAnalytics} variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(analyticsData.revenue.total)}
              </p>
              <p className="text-xs text-muted-foreground">
                {analyticsData.revenue.transactions} transactions
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Inventory Value
              </p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(analyticsData.inventory.totalValue)}
              </p>
              <p className="text-xs text-muted-foreground">
                {analyticsData.inventory.totalProducts} products
              </p>
            </div>
            <Package className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Profit Margin
              </p>
              <p className="text-2xl font-bold text-foreground">
                {formatPercentage(analyticsData.inventory.profitMargin)}
              </p>
              <p className="text-xs text-muted-foreground">Gross margin</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Prescriptions
              </p>
              <p className="text-2xl font-bold text-foreground">
                {analyticsData.prescriptions.total || 0}
              </p>
              <p className="text-xs text-muted-foreground">
                Avg: {formatCurrency(analyticsData.prescriptions.avgValue)}
              </p>
            </div>
            <Users className="h-8 w-8 text-purple-600" />
          </div>
        </Card>
      </div>

      {/* Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-orange-200 dark:border-orange-800">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-orange-600" />
            <div>
              <p className="text-lg font-semibold text-foreground">
                {analyticsData.inventory.lowStockItems || 0}
              </p>
              <p className="text-sm text-muted-foreground">Low Stock Items</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-red-200 dark:border-red-800">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-red-600" />
            <div>
              <p className="text-lg font-semibold text-foreground">
                {analyticsData.inventory.expiredItems || 0}
              </p>
              <p className="text-sm text-muted-foreground">Expired Products</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-3">
            <Calendar className="h-8 w-8 text-yellow-600" />
            <div>
              <p className="text-lg font-semibold text-foreground">
                {analyticsData.inventory.expiringSoonItems || 0}
              </p>
              <p className="text-sm text-muted-foreground">Expiring Soon</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Top Products */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Target className="h-5 w-5" />
          Top Selling Products
        </h3>
        <div className="space-y-3">
          {analyticsData.sales.topProducts
            ?.slice(0, 5)
            .map((product, index) => (
              <div
                key={product.name}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{index + 1}</Badge>
                  <div>
                    <p className="font-medium text-foreground">
                      {product.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {product.quantity} units sold
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">
                    {formatCurrency(product.revenue)}
                  </p>
                </div>
              </div>
            ))}
        </div>
      </Card>

      {/* Movement Types */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <LineChart className="h-5 w-5" />
          Stock Movement Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(analyticsData.movements.byType || {}).map(
            ([type, data]) => (
              <div key={type} className="p-4 bg-muted/30 rounded-lg">
                <p className="text-sm font-medium text-muted-foreground capitalize">
                  {type.replace("_", " ")}
                </p>
                <p className="text-xl font-bold text-foreground">
                  {data.totalQuantity}
                </p>
                <p className="text-xs text-muted-foreground">
                  {data.count} transactions
                </p>
              </div>
            )
          )}
        </div>
      </Card>
    </div>
  );
};
