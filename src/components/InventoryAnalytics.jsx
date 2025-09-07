import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Package,
  AlertTriangle,
  Calendar,
  DollarSign,
  Users,
  ShoppingCart,
  BarChart3,
  Activity,
} from "lucide-react";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
];

export const InventoryAnalytics = ({ products, categories }) => {
  const [selectedPeriod, setSelectedPeriod] = useState("30");

  const analytics = useMemo(() => {
    if (!products || products.length === 0) return null;

    const today = new Date();
    // const periodDays = parseInt(selectedPeriod);
    // const periodStart = new Date(today.getTime() - (periodDays * 24 * 60 * 60 * 1000));

    // Basic metrics
    const totalProducts = products.length;
    const totalStockValue = products.reduce(
      (sum, p) => sum + p.selling_price * p.stock_quantity,
      0
    );
    const totalCostValue = products.reduce(
      (sum, p) => sum + p.cost_price * p.stock_quantity,
      0
    );
    const totalUnits = products.reduce((sum, p) => sum + p.stock_quantity, 0);

    // Product status analysis
    const lowStockProducts = products.filter(
      (p) => p.stock_quantity <= p.min_stock_level
    );
    const expiredProducts = products.filter(
      (p) => new Date(p.expiry_date) <= today
    );
    const expiringSoonProducts = products.filter((p) => {
      const expiry = new Date(p.expiry_date);
      const daysUntilExpiry = Math.ceil(
        (expiry - today) / (1000 * 60 * 60 * 24)
      );
      return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
    });

    // Category analysis
    const categoryData = categories
      .map((category) => {
        const categoryProducts = products.filter(
          (p) => p.category_id === category.id
        );
        const totalValue = categoryProducts.reduce(
          (sum, p) => sum + p.selling_price * p.stock_quantity,
          0
        );
        const totalQty = categoryProducts.reduce(
          (sum, p) => sum + p.stock_quantity,
          0
        );

        return {
          name: category.name,
          products: categoryProducts.length,
          value: totalValue,
          quantity: totalQty,
          percentage: ((categoryProducts.length / totalProducts) * 100).toFixed(
            1
          ),
        };
      })
      .sort((a, b) => b.value - a.value);

    // Stock level distribution
    const stockLevelDistribution = [
      {
        name: "Overstocked",
        count: products.filter((p) => p.stock_quantity > p.min_stock_level * 3)
          .length,
        color: "#00C49F",
      },
      {
        name: "Well Stocked",
        count: products.filter(
          (p) =>
            p.stock_quantity > p.min_stock_level &&
            p.stock_quantity <= p.min_stock_level * 3
        ).length,
        color: "#0088FE",
      },
      {
        name: "Low Stock",
        count: lowStockProducts.length,
        color: "#FFBB28",
      },
      {
        name: "Out of Stock",
        count: products.filter((p) => p.stock_quantity === 0).length,
        color: "#FF8042",
      },
    ];

    // Price analysis
    const priceRanges = [
      { range: "₱0-100", min: 0, max: 100 },
      { range: "₱101-500", min: 101, max: 500 },
      { range: "₱501-1000", min: 501, max: 1000 },
      { range: "₱1001-2000", min: 1001, max: 2000 },
      { range: "₱2000+", min: 2001, max: Infinity },
    ];

    const priceDistribution = priceRanges.map((range) => ({
      range: range.range,
      count: products.filter(
        (p) =>
          p.selling_price >= range.min &&
          (range.max === Infinity ? true : p.selling_price <= range.max)
      ).length,
    }));

    // Expiry analysis for next 12 months
    const expiryAnalysis = [];
    for (let i = 0; i < 12; i++) {
      const monthStart = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const monthEnd = new Date(
        today.getFullYear(),
        today.getMonth() + i + 1,
        0
      );

      const expiringInMonth = products.filter((p) => {
        const expiry = new Date(p.expiry_date);
        return expiry >= monthStart && expiry <= monthEnd;
      });

      expiryAnalysis.push({
        month: monthStart.toLocaleDateString("en-US", {
          month: "short",
          year: "2-digit",
        }),
        products: expiringInMonth.length,
        value: expiringInMonth.reduce(
          (sum, p) => sum + p.selling_price * p.stock_quantity,
          0
        ),
      });
    }

    // Profit margin analysis
    const profitMarginData = products
      .map((p) => {
        const margin =
          ((p.selling_price - p.cost_price) / p.selling_price) * 100;
        return {
          name: p.name,
          margin: margin.toFixed(1),
          profit: (p.selling_price - p.cost_price) * p.stock_quantity,
          category:
            categories.find((c) => c.id === p.category_id)?.name || "Unknown",
        };
      })
      .sort((a, b) => b.profit - a.profit);

    const averageMargin =
      profitMarginData.reduce((sum, p) => sum + parseFloat(p.margin), 0) /
      profitMarginData.length;

    return {
      totalProducts,
      totalStockValue,
      totalCostValue,
      totalUnits,
      lowStockProducts: lowStockProducts.length,
      expiredProducts: expiredProducts.length,
      expiringSoonProducts: expiringSoonProducts.length,
      potentialProfit: totalStockValue - totalCostValue,
      averageMargin: averageMargin.toFixed(1),
      categoryData,
      stockLevelDistribution,
      priceDistribution,
      expiryAnalysis,
      profitMarginData: profitMarginData.slice(0, 10), // Top 10 most profitable
      turnoverRate: ((totalUnits / totalProducts) * 100).toFixed(1),
    };
  }, [products, categories]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount || 0);
  };

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Inventory Analytics
          </h2>
          <p className="text-muted-foreground">
            Comprehensive insights into your pharmacy inventory
          </p>
        </div>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
        </select>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Products
              </p>
              <p className="text-2xl font-bold text-foreground">
                {analytics.totalProducts}
              </p>
              <p className="text-xs text-muted-foreground">
                {analytics.totalUnits} units total
              </p>
            </div>
            <Package className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Stock Value
              </p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(analytics.totalStockValue)}
              </p>
              <p className="text-xs text-muted-foreground">
                Cost: {formatCurrency(analytics.totalCostValue)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-success" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Potential Profit
              </p>
              <p className="text-2xl font-bold text-success">
                {formatCurrency(analytics.potentialProfit)}
              </p>
              <p className="text-xs text-muted-foreground">
                Avg margin: {analytics.averageMargin}%
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-success" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Alerts
              </p>
              <p className="text-2xl font-bold text-warning">
                {analytics.lowStockProducts +
                  analytics.expiredProducts +
                  analytics.expiringSoonProducts}
              </p>
              <p className="text-xs text-muted-foreground">Needs attention</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-warning" />
          </div>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Inventory by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name} (${percentage}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="products"
              >
                {analytics.categoryData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [value, "Products"]} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Stock Level Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            Stock Level Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.stockLevelDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#0088FE" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Price Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            Price Range Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.priceDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#00C49F" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Expiry Timeline */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            Product Expiry Timeline
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analytics.expiryAnalysis}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value, name) => [
                  value,
                  name === "products" ? "Products" : "Value",
                ]}
              />
              <Area
                type="monotone"
                dataKey="products"
                stackId="1"
                stroke="#FFBB28"
                fill="#FFBB28"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Top Profitable Products */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Most Profitable Products</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">Product</th>
                <th className="text-left p-3 font-medium">Category</th>
                <th className="text-left p-3 font-medium">Profit Margin</th>
                <th className="text-left p-3 font-medium">Total Profit</th>
              </tr>
            </thead>
            <tbody>
              {analytics.profitMarginData.map((product, index) => (
                <tr key={index} className="border-t border-border">
                  <td className="p-3 font-medium">{product.name}</td>
                  <td className="p-3 text-muted-foreground">
                    {product.category}
                  </td>
                  <td className="p-3">
                    <Badge
                      variant={
                        parseFloat(product.margin) >= 20 ? "success" : "warning"
                      }
                    >
                      {product.margin}%
                    </Badge>
                  </td>
                  <td className="p-3 font-medium text-success">
                    {formatCurrency(product.profit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-l-4 border-l-warning">
          <div className="flex items-center gap-3">
            <TrendingDown className="h-6 w-6 text-warning" />
            <div>
              <h4 className="font-semibold text-foreground">Low Stock Alert</h4>
              <p className="text-2xl font-bold text-warning">
                {analytics.lowStockProducts}
              </p>
              <p className="text-sm text-muted-foreground">
                Products need reordering
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-destructive">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <div>
              <h4 className="font-semibold text-foreground">
                Expired Products
              </h4>
              <p className="text-2xl font-bold text-destructive">
                {analytics.expiredProducts}
              </p>
              <p className="text-sm text-muted-foreground">
                Remove from inventory
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-orange-500">
          <div className="flex items-center gap-3">
            <Calendar className="h-6 w-6 text-orange-500" />
            <div>
              <h4 className="font-semibold text-foreground">Expiring Soon</h4>
              <p className="text-2xl font-bold text-orange-500">
                {analytics.expiringSoonProducts}
              </p>
              <p className="text-sm text-muted-foreground">Within 30 days</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default InventoryAnalytics;
