import { useState, useEffect, useCallback } from "react";
import {
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  Plus,
  Receipt,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useToast } from "../contexts/ToastContext";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Badge } from "./ui/Badge";
import { LoadingSpinner } from "./ui/LoadingSpinner";

export const SalesManagement = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("today");
  const [selectedSale, setSelectedSale] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchSales();
  }, [dateRange, statusFilter]);

  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);

      let query = supabase
        .from("sales")
        .select(
          `
          *,
          users(first_name, last_name),
          sale_items(
            *,
            products(name, generic_name)
          )
        `
        )
        .order("created_at", { ascending: false });

      // Apply date filter
      const today = new Date();
      let startDate;

      switch (dateRange) {
        case "today":
          startDate = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate()
          );
          break;
        case "week":
          startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
          break;
        case "year":
          startDate = new Date(today.getFullYear(), 0, 1);
          break;
        default:
          startDate = null;
      }

      if (startDate) {
        query = query.gte("created_at", startDate.toISOString());
      }

      // Apply status filter
      if (statusFilter !== "all") {
        query = query.eq("payment_status", statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSales(data || []);
    } catch (err) {
      console.error("Error fetching sales:", err);
      toast.error("Failed to load sales data");
    } finally {
      setLoading(false);
    }
  }, [dateRange, statusFilter, toast]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount || 0);
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString("en-PH");
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case "completed":
        return "success";
      case "pending":
        return "warning";
      case "failed":
        return "destructive";
      case "refunded":
        return "secondary";
      default:
        return "default";
    }
  };

  const filteredSales = sales.filter((sale) => {
    const matchesSearch =
      sale.sale_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.customer_phone?.includes(searchTerm);

    return matchesSearch;
  });

  const calculateSummary = () => {
    const totalSales = filteredSales.reduce(
      (sum, sale) => sum + sale.total_amount,
      0
    );
    const totalTransactions = filteredSales.length;
    const averageTransaction =
      totalTransactions > 0 ? totalSales / totalTransactions : 0;
    const completedSales = filteredSales.filter(
      (s) => s.payment_status === "completed"
    );
    const pendingSales = filteredSales.filter(
      (s) => s.payment_status === "pending"
    );

    return {
      totalSales,
      totalTransactions,
      averageTransaction,
      completedCount: completedSales.length,
      pendingCount: pendingSales.length,
    };
  };

  const summary = calculateSummary();

  const exportSales = () => {
    if (filteredSales.length === 0) {
      toast.warning("No sales data to export");
      return;
    }

    const csvData = filteredSales.map((sale) => ({
      "Sale Number": sale.sale_number,
      Date: formatDateTime(sale.created_at),
      Customer: sale.customer_name || "Walk-in",
      Phone: sale.customer_phone || "",
      Items: sale.sale_items?.length || 0,
      Subtotal: sale.subtotal,
      Tax: sale.tax_amount,
      Discount: sale.discount_amount,
      Total: sale.total_amount,
      "Payment Method": sale.payment_method,
      Status: sale.payment_status,
      Cashier: `${sale.users?.first_name || ""} ${
        sale.users?.last_name || ""
      }`.trim(),
    }));

    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(","),
      ...csvData.map((row) =>
        headers.map((header) => `"${row[header]}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sales_report_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success("Sales report exported successfully");
  };

  const viewSaleDetails = (sale) => {
    setSelectedSale(sale);
    setShowDetails(true);
  };

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
          <h2 className="text-2xl font-bold text-foreground">
            Sales Management
          </h2>
          <p className="text-muted-foreground">
            Track and manage pharmacy sales transactions
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={exportSales} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Sales
              </p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(summary.totalSales)}
              </p>
              <p className="text-xs text-muted-foreground">
                {summary.totalTransactions} transactions
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-success" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Avg Transaction
              </p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(summary.averageTransaction)}
              </p>
              <p className="text-xs text-muted-foreground">per sale</p>
            </div>
            <TrendingUp className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Completed
              </p>
              <p className="text-2xl font-bold text-success">
                {summary.completedCount}
              </p>
              <p className="text-xs text-muted-foreground">transactions</p>
            </div>
            <Receipt className="h-8 w-8 text-success" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Pending
              </p>
              <p className="text-2xl font-bold text-warning">
                {summary.pendingCount}
              </p>
              <p className="text-xs text-muted-foreground">transactions</p>
            </div>
            <Calendar className="h-8 w-8 text-warning" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by sale number, customer name, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
          <option value="all">All Time</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {/* Sales Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium text-foreground">
                  Sale #
                </th>
                <th className="text-left p-4 font-medium text-foreground">
                  Date
                </th>
                <th className="text-left p-4 font-medium text-foreground">
                  Customer
                </th>
                <th className="text-left p-4 font-medium text-foreground">
                  Items
                </th>
                <th className="text-left p-4 font-medium text-foreground">
                  Total
                </th>
                <th className="text-left p-4 font-medium text-foreground">
                  Payment
                </th>
                <th className="text-left p-4 font-medium text-foreground">
                  Status
                </th>
                <th className="text-left p-4 font-medium text-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map((sale) => (
                <tr
                  key={sale.id}
                  className="border-t border-border hover:bg-muted/30"
                >
                  <td className="p-4">
                    <span className="font-medium text-foreground">
                      {sale.sale_number}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-foreground">
                      {formatDateTime(sale.created_at)}
                    </span>
                  </td>
                  <td className="p-4">
                    <div>
                      <p className="font-medium text-foreground">
                        {sale.customer_name || "Walk-in Customer"}
                      </p>
                      {sale.customer_phone && (
                        <p className="text-xs text-muted-foreground">
                          {sale.customer_phone}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-foreground">
                      {sale.sale_items?.length || 0}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="font-medium text-foreground">
                      {formatCurrency(sale.total_amount)}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-foreground capitalize">
                      {sale.payment_method.replace("_", " ")}
                    </span>
                  </td>
                  <td className="p-4">
                    <Badge
                      variant={getStatusVariant(sale.payment_status)}
                      size="sm"
                    >
                      {sale.payment_status}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => viewSaleDetails(sale)}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredSales.length === 0 && (
          <div className="text-center py-8">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchTerm
                ? "No sales match your search criteria"
                : "No sales found"}
            </p>
          </div>
        )}
      </Card>

      {/* Sale Details Modal */}
      {showDetails && selectedSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">
                  Sale Details - {selectedSale.sale_number}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDetails(false)}
                >
                  Close
                </Button>
              </div>

              <div className="space-y-6">
                {/* Sale Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">
                      {formatDateTime(selectedSale.created_at)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge
                      variant={getStatusVariant(selectedSale.payment_status)}
                    >
                      {selectedSale.payment_status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Customer</p>
                    <p className="font-medium">
                      {selectedSale.customer_name || "Walk-in Customer"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Payment Method
                    </p>
                    <p className="font-medium capitalize">
                      {selectedSale.payment_method.replace("_", " ")}
                    </p>
                  </div>
                </div>

                {/* Sale Items */}
                <div>
                  <h4 className="font-medium mb-3">Items Purchased</h4>
                  <div className="space-y-2">
                    {selectedSale.sale_items?.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-3 bg-muted/30 rounded"
                      >
                        <div>
                          <p className="font-medium">{item.products?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Qty: {item.quantity} ×{" "}
                            {formatCurrency(item.unit_price)}
                          </p>
                        </div>
                        <p className="font-medium">
                          {formatCurrency(item.total_price)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(selectedSale.subtotal)}</span>
                  </div>
                  {selectedSale.discount_amount > 0 && (
                    <div className="flex justify-between text-success">
                      <span>Discount:</span>
                      <span>
                        -{formatCurrency(selectedSale.discount_amount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>{formatCurrency(selectedSale.tax_amount)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>{formatCurrency(selectedSale.total_amount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
