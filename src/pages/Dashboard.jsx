import {
  LayoutDashboard,
  Package,
  TrendingUp,
  AlertTriangle,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { useDashboard } from "../hooks/useDashboard";
import { useProducts } from "../hooks/useProducts";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { SystemHealthMonitor } from "../components/SystemHealthMonitor";

export const Dashboard = () => {
  const {
    data: dashboardData,
    loading: dashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useDashboard();
  const {
    loading: productsLoading,
    getLowStockProducts,
    getExpiredProducts,
    getExpiringSoonProducts,
    refetch: refetchProducts,
  } = useProducts();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleRefresh = async () => {
    await Promise.all([refetchDashboard(), refetchProducts()]);
  };

  if (dashboardLoading || productsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (dashboardError) {
    return (
      <div className="text-center p-8">
        <p className="text-destructive">
          Error loading dashboard: {dashboardError}
        </p>
        <Button onClick={handleRefresh} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  const stats = dashboardData?.products || {};
  const sales = dashboardData?.sales || {};
  const recentSales = sales.recent || [];

  const lowStockProducts = getLowStockProducts();
  const expiredProducts = getExpiredProducts();
  const expiringSoonProducts = getExpiringSoonProducts();

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your pharmacy operations
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Products
              </p>
              <p className="text-2xl font-bold text-foreground">
                {stats.total?.toLocaleString() || "0"}
              </p>
            </div>
            <Package className="h-8 w-8 text-primary" />
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Today's Sales
              </p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(sales.today)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-accent" />
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Low Stock Items
              </p>
              <p className="text-2xl font-bold text-foreground">
                {stats.low_stock || 0}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-warning" />
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Expired Items
              </p>
              <p className="text-2xl font-bold text-foreground">
                {stats.expired || 0}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
        </div>
      </div>

      {/* Monthly sales card */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            Monthly Performance
          </h2>
          <Calendar className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(sales.month)}
            </p>
            <p className="text-sm text-muted-foreground">This Month</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">
              {recentSales.length}
            </p>
            <p className="text-sm text-muted-foreground">Transactions</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">
              {recentSales.length > 0
                ? formatCurrency(sales.month / recentSales.length)
                : formatCurrency(0)}
            </p>
            <p className="text-sm text-muted-foreground">Avg. Sale</p>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Recent Sales
          </h2>
          <div className="space-y-3">
            {recentSales.length > 0 ? (
              recentSales.slice(0, 5).map((sale) => (
                <div
                  key={sale.id}
                  className="flex justify-between items-center py-2 border-b border-border/50 last:border-b-0"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {sale.sale_number}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {sale.customer_name || "Walk-in Customer"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(sale.sale_date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-foreground">
                      {formatCurrency(sale.total_amount)}
                    </p>
                    <Badge
                      variant={
                        sale.status === "completed" ? "success" : "warning"
                      }
                      size="sm"
                    >
                      {sale.status}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">No recent sales</p>
            )}
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Alerts & Notifications
          </h2>
          <div className="space-y-3">
            {/* Expired products alerts */}
            {expiredProducts.slice(0, 3).map((product) => (
              <div
                key={`expired-${product.id}`}
                className="flex items-start gap-3 p-3 rounded-md bg-destructive/10 border border-destructive/20"
              >
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-destructive">
                    Product Expired
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {product.name} expired on{" "}
                    {new Date(product.expiry_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}

            {/* Expiring soon alerts */}
            {expiringSoonProducts.slice(0, 2).map((product) => (
              <div
                key={`expiring-${product.id}`}
                className="flex items-start gap-3 p-3 rounded-md bg-warning/10 border border-warning/20"
              >
                <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-warning">
                    Expiring Soon
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {product.name} expires on{" "}
                    {new Date(product.expiry_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}

            {/* Low stock alerts */}
            {lowStockProducts.slice(0, 2).map((product) => (
              <div
                key={`lowstock-${product.id}`}
                className="flex items-start gap-3 p-3 rounded-md bg-warning/10 border border-warning/20"
              >
                <Package className="h-4 w-4 text-warning mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-warning">
                    Low Stock Alert
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {product.name} has only {product.stock_quantity} pieces left
                  </p>
                </div>
              </div>
            ))}

            {/* No alerts message */}
            {expiredProducts.length === 0 &&
              expiringSoonProducts.length === 0 &&
              lowStockProducts.length === 0 && (
                <div className="flex items-start gap-3 p-3 rounded-md bg-success/10 border border-success/20">
                  <LayoutDashboard className="h-4 w-4 text-success mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-success">
                      All Good!
                    </p>
                    <p className="text-xs text-muted-foreground">
                      No urgent alerts at this time
                    </p>
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* System Health Monitor */}
        <SystemHealthMonitor />
      </div>
    </div>
  );
};
