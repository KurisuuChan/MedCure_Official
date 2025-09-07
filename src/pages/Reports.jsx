import { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Filter,
  FileText,
  DollarSign,
  Package,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";

export const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState([]);
  const [productData, setProductData] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30))
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });
  const [reportType, setReportType] = useState("sales");

  useEffect(() => {
    fetchReports();
  }, [dateRange, reportType]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchReports = async () => {
    try {
      setLoading(true);

      // Fetch analytics
      const { data: analyticsData, error: analyticsError } = await supabase.rpc(
        "get_dashboard_analytics"
      );

      if (analyticsError) throw analyticsError;
      setAnalytics(analyticsData);

      // Fetch sales data
      const { data: sales, error: salesError } = await supabase
        .from("sales")
        .select(
          `
          *,
          sale_items (
            quantity,
            unit_price,
            total_price,
            products (name, category_id)
          ),
          cashier:user_profiles!sales_cashier_id_fkey (
            full_name
          )
        `
        )
        .gte("sale_date", dateRange.startDate)
        .lte("sale_date", dateRange.endDate + "T23:59:59")
        .eq("status", "completed")
        .order("sale_date", { ascending: false });

      if (salesError) throw salesError;
      setSalesData(sales || []);

      // Fetch product data
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select(
          `
          *,
          categories (name)
        `
        )
        .eq("is_active", true);

      if (productsError) throw productsError;
      setProductData(products || []);
    } catch (err) {
      console.error("Error fetching reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-PH");
  };

  // Sales Analytics
  const getSalesAnalytics = () => {
    const totalSales = salesData.reduce(
      (sum, sale) => sum + sale.total_amount,
      0
    );
    const totalTransactions = salesData.length;
    const averageTransaction =
      totalTransactions > 0 ? totalSales / totalTransactions : 0;

    // Top selling products
    const productSales = {};
    salesData.forEach((sale) => {
      sale.sale_items.forEach((item) => {
        const productName = item.products?.name || "Unknown Product";
        if (!productSales[productName]) {
          productSales[productName] = { quantity: 0, revenue: 0 };
        }
        productSales[productName].quantity += item.quantity;
        productSales[productName].revenue += item.total_price;
      });
    });

    const topProducts = Object.entries(productSales)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Payment methods
    const paymentMethods = {};
    salesData.forEach((sale) => {
      const method = sale.payment_method || "cash";
      if (!paymentMethods[method]) {
        paymentMethods[method] = { count: 0, amount: 0 };
      }
      paymentMethods[method].count += 1;
      paymentMethods[method].amount += sale.total_amount;
    });

    return {
      totalSales,
      totalTransactions,
      averageTransaction,
      topProducts,
      paymentMethods,
    };
  };

  // Inventory Analytics
  const getInventoryAnalytics = () => {
    const totalProducts = productData.length;
    const totalValue = productData.reduce(
      (sum, product) => sum + product.selling_price * product.stock_quantity,
      0
    );

    const lowStockProducts = productData.filter(
      (p) => p.stock_quantity <= p.min_stock_level
    );

    const expiredProducts = productData.filter(
      (p) => new Date(p.expiry_date) <= new Date()
    );

    const expiringSoonProducts = productData.filter((p) => {
      const today = new Date();
      const expiry = new Date(p.expiry_date);
      const daysUntilExpiry = Math.ceil(
        (expiry - today) / (1000 * 60 * 60 * 24)
      );
      return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
    });

    // Category breakdown
    const categoryBreakdown = {};
    productData.forEach((product) => {
      const categoryName = product.categories?.name || "Uncategorized";
      if (!categoryBreakdown[categoryName]) {
        categoryBreakdown[categoryName] = {
          count: 0,
          value: 0,
          stock: 0,
        };
      }
      categoryBreakdown[categoryName].count += 1;
      categoryBreakdown[categoryName].value +=
        product.selling_price * product.stock_quantity;
      categoryBreakdown[categoryName].stock += product.stock_quantity;
    });

    return {
      totalProducts,
      totalValue,
      lowStockProducts,
      expiredProducts,
      expiringSoonProducts,
      categoryBreakdown,
    };
  };

  const exportToCSV = () => {
    let csvData = "";
    let filename = "";

    if (reportType === "sales") {
      const headers = [
        "Date",
        "Sale Number",
        "Customer",
        "Total Amount",
        "Payment Method",
        "Cashier",
      ];
      csvData = headers.join(",") + "\n";

      salesData.forEach((sale) => {
        const row = [
          formatDate(sale.sale_date),
          sale.sale_number,
          sale.customer_name || "Walk-in",
          sale.total_amount,
          sale.payment_method,
          sale.cashier?.full_name || "Unknown",
        ];
        csvData += row.join(",") + "\n";
      });

      filename = `sales-report-${dateRange.startDate}-to-${dateRange.endDate}.csv`;
    } else {
      const headers = [
        "Product Name",
        "Category",
        "Stock Quantity",
        "Min Stock",
        "Selling Price",
        "Expiry Date",
      ];
      csvData = headers.join(",") + "\n";

      productData.forEach((product) => {
        const row = [
          product.name,
          product.categories?.name || "Uncategorized",
          product.stock_quantity,
          product.min_stock_level,
          product.selling_price,
          formatDate(product.expiry_date),
        ];
        csvData += row.join(",") + "\n";
      });

      filename = `inventory-report-${
        new Date().toISOString().split("T")[0]
      }.csv`;
    }

    const blob = new Blob([csvData], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const salesAnalytics = getSalesAnalytics();
  const inventoryAnalytics = getInventoryAnalytics();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground">
            Analyze your pharmacy performance and trends
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={fetchReports} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportToCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
          >
            <option value="sales">Sales Report</option>
            <option value="inventory">Inventory Report</option>
          </select>
        </div>

        {reportType === "sales" && (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={dateRange.startDate}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, startDate: e.target.value }))
              }
              className="w-auto"
            />
            <span className="text-muted-foreground">to</span>
            <Input
              type="date"
              value={dateRange.endDate}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, endDate: e.target.value }))
              }
              className="w-auto"
            />
          </div>
        )}
      </div>

      {/* Sales Report */}
      {reportType === "sales" && (
        <>
          {/* Sales Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Revenue
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(salesAnalytics.totalSales)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-success" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Transactions
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {salesAnalytics.totalTransactions}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-primary" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Avg. Transaction
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(salesAnalytics.averageTransaction)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-accent" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Today's Sales
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(analytics?.sales?.today || 0)}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-warning" />
              </div>
            </Card>
          </div>

          {/* Top Products & Payment Methods */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Top Selling Products
              </h2>
              <div className="space-y-3">
                {salesAnalytics.topProducts
                  .slice(0, 5)
                  .map((product, index) => (
                    <div
                      key={product.name}
                      className="flex items-center justify-between p-3 border border-border rounded-lg"
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
                      <p className="font-semibold text-foreground">
                        {formatCurrency(product.revenue)}
                      </p>
                    </div>
                  ))}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Payment Methods
              </h2>
              <div className="space-y-3">
                {Object.entries(salesAnalytics.paymentMethods).map(
                  ([method, data]) => (
                    <div
                      key={method}
                      className="flex items-center justify-between p-3 border border-border rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-foreground capitalize">
                          {method}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {data.count} transactions
                        </p>
                      </div>
                      <p className="font-semibold text-foreground">
                        {formatCurrency(data.amount)}
                      </p>
                    </div>
                  )
                )}
              </div>
            </Card>
          </div>

          {/* Recent Sales Table */}
          <Card className="overflow-hidden">
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">
                Recent Sales
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium text-foreground">
                      Date
                    </th>
                    <th className="text-left p-4 font-medium text-foreground">
                      Sale #
                    </th>
                    <th className="text-left p-4 font-medium text-foreground">
                      Customer
                    </th>
                    <th className="text-left p-4 font-medium text-foreground">
                      Items
                    </th>
                    <th className="text-left p-4 font-medium text-foreground">
                      Amount
                    </th>
                    <th className="text-left p-4 font-medium text-foreground">
                      Payment
                    </th>
                    <th className="text-left p-4 font-medium text-foreground">
                      Cashier
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {salesData.slice(0, 10).map((sale) => (
                    <tr
                      key={sale.id}
                      className="border-t border-border hover:bg-muted/30"
                    >
                      <td className="p-4 text-sm text-foreground">
                        {formatDate(sale.sale_date)}
                      </td>
                      <td className="p-4 text-sm font-medium text-foreground">
                        {sale.sale_number}
                      </td>
                      <td className="p-4 text-sm text-foreground">
                        {sale.customer_name || "Walk-in Customer"}
                      </td>
                      <td className="p-4 text-sm text-foreground">
                        {sale.sale_items.length} items
                      </td>
                      <td className="p-4 text-sm font-semibold text-foreground">
                        {formatCurrency(sale.total_amount)}
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" size="sm">
                          {sale.payment_method}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-foreground">
                        {sale.cashier?.full_name || "Unknown"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* Inventory Report */}
      {reportType === "inventory" && (
        <>
          {/* Inventory Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Products
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {inventoryAnalytics.totalProducts}
                  </p>
                </div>
                <Package className="h-8 w-8 text-primary" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Inventory Value
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(inventoryAnalytics.totalValue)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-success" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Low Stock
                  </p>
                  <p className="text-2xl font-bold text-warning">
                    {inventoryAnalytics.lowStockProducts.length}
                  </p>
                </div>
                <TrendingDown className="h-8 w-8 text-warning" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Expired
                  </p>
                  <p className="text-2xl font-bold text-destructive">
                    {inventoryAnalytics.expiredProducts.length}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
            </Card>
          </div>

          {/* Category Breakdown */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Category Breakdown
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(inventoryAnalytics.categoryBreakdown).map(
                ([category, data]) => (
                  <div
                    key={category}
                    className="p-4 border border-border rounded-lg"
                  >
                    <h3 className="font-medium text-foreground">{category}</h3>
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Products:</span>
                        <span className="text-foreground">{data.count}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Stock:</span>
                        <span className="text-foreground">
                          {data.stock} units
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Value:</span>
                        <span className="text-foreground">
                          {formatCurrency(data.value)}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </Card>

          {/* Alert Items */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Low Stock Items
              </h2>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {inventoryAnalytics.lowStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {product.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Stock: {product.stock_quantity} / Min:{" "}
                        {product.min_stock_level}
                      </p>
                    </div>
                    <Badge variant="warning" size="sm">
                      Low Stock
                    </Badge>
                  </div>
                ))}
                {inventoryAnalytics.lowStockProducts.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    No low stock items
                  </p>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Expiring Soon
              </h2>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {inventoryAnalytics.expiringSoonProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {product.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Expires: {formatDate(product.expiry_date)}
                      </p>
                    </div>
                    <Badge variant="warning" size="sm">
                      Expiring
                    </Badge>
                  </div>
                ))}
                {inventoryAnalytics.expiringSoonProducts.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    No items expiring soon
                  </p>
                )}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};
