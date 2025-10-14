import React, { useState, useEffect, useCallback } from "react";
// ...existing imports...
import { useAuth } from "../hooks/useAuth";
import { UserManagementService } from "../services/domains/auth/userManagementService";
import { useNavigate } from "react-router-dom";
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  AlertTriangle,
  Activity,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  BarChart3,
  Stethoscope,
  Heart,
  ChevronRight,
  Eye,
  ArrowUpRight,
  Database,
  Headphones,
  Pill,
  UserCheck,
  CheckCircle,
} from "lucide-react";
import { DashboardService } from "../services/domains/analytics/dashboardService";
import { formatCurrency, formatNumber } from "../utils/formatting";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import SalesChart from "../components/charts/SalesChart";
import VerticalBarChart from "../components/charts/VerticalBarChart";
import StandardizedProductDisplay from "../components/ui/StandardizedProductDisplay";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function DashboardPage() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get current user role
  const { user } = useAuth();
  const userRole = user?.role;
  const isEmployee = userRole === UserManagementService.ROLES.EMPLOYEE;
        {/* Quick Actions and Inventory Analysis (hidden for employees) */}
        {!isEmployee && (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Quick Actions
                  </h3>
                  <p className="text-gray-500 text-sm">Essential tasks</p>
                </div>
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Stethoscope className="h-5 w-5 text-gray-600" />
                </div>
              </div>
              <div className="space-y-3">
                <MemoizedCleanActionCard
                  icon={ShoppingCart}
                  title="Process Sale"
                  description="Quick POS transaction"
                  href="/pos"
                  color="blue"
                  badge="Popular"
                />
                <MemoizedCleanActionCard
                  icon={Pill}
                  title="Add Medication"
                  description="Add new products"
                  href="/inventory"
                  color="green"
                />
                <MemoizedCleanActionCard
                  icon={Package}
                  title="Batch Management"
                  description="Track product batches"
                  href="/batch-management"
                  color="purple"
                />
                <MemoizedCleanActionCard
                  icon={UserCheck}
                  title="User Management"
                  description="System administration"
                  href="/management"
                  color="gray"
                />
                <MemoizedCleanActionCard
                  icon={Users}
                  title="Customer Information"
                  description="View customer database"
                  href="/customers"
                  color="orange"
                />
              </div>
            </div>

            {/* Inventory Analysis */}
            <div
              onClick={() => navigate("/inventory")}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.01] h-fit"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && navigate("/inventory")}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Inventory Analysis
                  </h3>
                  <p className="text-sm text-gray-600">Stock value by category</p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <Package className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <div className="h-56">
                {dashboardData.categoryAnalysis &&
                dashboardData.categoryAnalysis.length > 0 ? (
                  <Doughnut
                    data={{
                      labels: dashboardData.categoryAnalysis.map(
                        (cat) => cat.name
                      ),
                      datasets: [
                        {
                          data: dashboardData.categoryAnalysis.map((cat) =>
                            parseFloat(cat.percentage)
                          ),
                          backgroundColor: [
                            "rgba(59, 130, 246, 0.8)", // Blue
                            "rgba(16, 185, 129, 0.8)", // Green
                            "rgba(245, 158, 11, 0.8)", // Amber
                            "rgba(139, 92, 246, 0.8)", // Purple
                            "rgba(236, 72, 153, 0.8)", // Pink
                            "rgba(107, 114, 128, 0.8)", // Gray
                            "rgba(239, 68, 68, 0.8)", // Red
                            "rgba(20, 184, 166, 0.8)", // Teal
                          ].slice(0, dashboardData.categoryAnalysis.length),
                          borderWidth: 2,
                          borderColor: "#ffffff",
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      layout: {
                        padding: {
                          top: 10,
                          bottom: 10,
                        },
                      },
                      plugins: {
                        legend: {
                          position: "bottom",
                          labels: {
                            padding: 10,
                            usePointStyle: true,
                            boxWidth: 12,
                          },
                        },
                      },
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    No data available
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
                onClick={loadDashboardData}
                disabled={isLoading}
                className="bg-gray-900 text-white hover:bg-gray-800 px-6 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2 font-medium disabled:bg-gray-400"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                />
                <span>{isLoading ? "Refreshing..." : "Refresh"}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Metrics Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MemoizedCleanMetricCard
            title="Revenue Today"
            value={formatCurrency(dashboardData.totalSales || 0)}
            icon={TrendingUp}
            trend={
              dashboardData.growthPercentages?.revenue
                ? Number(dashboardData.growthPercentages.revenue.toFixed(1))
                : 0
            }
            trendText="vs yesterday"
            color="green"
            href="/transaction-history"
            onClick={() => navigate("/transaction-history")}
          />
          <MemoizedCleanMetricCard
            title="Total Products"
            value={formatNumber(dashboardData.totalProducts || 0)}
            icon={Package}
            trend={null}
            trendText="inventory count"
            color="blue"
            href="/inventory"
            onClick={() => navigate("/inventory")}
          />
          <MemoizedCleanMetricCard
            title="Low Stock Alert"
            value={formatNumber(dashboardData.lowStockCount || 0)}
            icon={AlertTriangle}
            trend={null}
            trendText="items need restock"
            color="amber"
            isAlert={true}
            href="/inventory"
            onClick={() =>
              navigate("/inventory", { state: { filter: "low-stock" } })
            }
          />
          <MemoizedCleanMetricCard
            title="Active Users"
            value={formatNumber(dashboardData.activeUsers || 0)}
            icon={Users}
            trend={null}
            trendText="system users"
            color="purple"
            href="/user-management"
            onClick={() => navigate("/user-management")}
          />
        </section>

        {/* Sales Overview - Full Width */}
        <main className="w-full">
          <section className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Sales Overview
                </h2>
                <p className="text-sm text-gray-600">
                  Comprehensive sales analytics and trends
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </div>
            <SalesChart />
          </section>
        </main>

        {/* Quick Actions and Inventory Analysis */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Quick Actions
                </h3>
                <p className="text-gray-500 text-sm">Essential tasks</p>
              </div>
              <div className="p-2 bg-gray-100 rounded-lg">
                <Stethoscope className="h-5 w-5 text-gray-600" />
              </div>
            </div>
            <div className="space-y-3">
              <MemoizedCleanActionCard
                icon={ShoppingCart}
                title="Process Sale"
                description="Quick POS transaction"
                href="/pos"
                color="blue"
                badge="Popular"
              />
              <MemoizedCleanActionCard
                icon={Pill}
                title="Add Medication"
                description="Add new products"
                href="/inventory"
                color="green"
              />
              <MemoizedCleanActionCard
                icon={Package}
                title="Batch Management"
                description="Track product batches"
                href="/batch-management"
                color="purple"
              />
              <MemoizedCleanActionCard
                icon={UserCheck}
                title="User Management"
                description="System administration"
                href="/management"
                color="gray"
              />
              <MemoizedCleanActionCard
                icon={Users}
                title="Customer Information"
                description="View customer database"
                href="/customers"
                color="orange"
              />
            </div>
          </div>

          {/* Inventory Analysis */}
          <div
            onClick={() => navigate("/inventory")}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.01] h-fit"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && navigate("/inventory")}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Inventory Analysis
                </h3>
                <p className="text-sm text-gray-600">Stock value by category</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Package className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="h-56">
              {dashboardData.categoryAnalysis &&
              dashboardData.categoryAnalysis.length > 0 ? (
                <Doughnut
                  data={{
                    labels: dashboardData.categoryAnalysis.map(
                      (cat) => cat.name
                    ),
                    datasets: [
                      {
                        data: dashboardData.categoryAnalysis.map((cat) =>
                          parseFloat(cat.percentage)
                        ),
                        backgroundColor: [
                          "rgba(59, 130, 246, 0.8)", // Blue
                          "rgba(16, 185, 129, 0.8)", // Green
                          "rgba(245, 158, 11, 0.8)", // Amber
                          "rgba(139, 92, 246, 0.8)", // Purple
                          "rgba(236, 72, 153, 0.8)", // Pink
                          "rgba(107, 114, 128, 0.8)", // Gray
                          "rgba(239, 68, 68, 0.8)", // Red
                          "rgba(20, 184, 166, 0.8)", // Teal
                        ].slice(0, dashboardData.categoryAnalysis.length),
                        borderWidth: 2,
                        borderColor: "#ffffff",
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: {
                      padding: {
                        top: 10,
                        bottom: 10,
                      },
                    },
                    plugins: {
                      legend: {
                        position: "bottom",
                        labels: {
                          padding: 10,
                          usePointStyle: true,
                          boxWidth: 12,
                          font: {
                            size: 12,
                          },
                          generateLabels: (chart) => {
                            const data = chart.data;
                            return data.labels.map((label, i) => ({
                              text: `${label} (${data.datasets[0].data[i]}%)`,
                              fillStyle: data.datasets[0].backgroundColor[i],
                              hidden: false,
                              index: i,
                            }));
                          },
                        },
                      },
                      tooltip: {
                        callbacks: {
                          label: (context) => {
                            const category =
                              dashboardData.categoryAnalysis[context.dataIndex];
                            return [
                              `${category.name}: ${category.percentage}%`,
                              `Value: ${formatCurrency(category.value)}`,
                              `Products: ${category.count}`,
                            ];
                          },
                        },
                      },
                    },
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No inventory data available</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Top Products - Full Width */}
        <section className="w-full">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div
              onClick={() => navigate("/inventory")}
              className="flex items-center justify-between mb-6 cursor-pointer hover:bg-gray-50 -m-2 p-2 rounded-lg transition-colors"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && navigate("/inventory")}
            >
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Top Products
                </h3>
                <p className="text-sm text-gray-600">
                  Best selling items this month
                </p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
            </div>

            {/* Vertical Bar Chart */}
            <div className="px-4 py-2">
              <VerticalBarChart
                data={
                  dashboardData.topProducts &&
                  dashboardData.topProducts.length > 0
                    ? dashboardData.topProducts.map((product) => ({
                        value: parseFloat(product.revenue || 0), // Ensure numeric value for sales amount
                        label:
                          product.brand_name ||
                          product.generic_name ||
                          "Unknown",
                        sublabel: `${product.sales || 0} units sold`, // Show units as sublabel
                        formattedValue: `₱${parseFloat(
                          product.revenue || 0
                        ).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`, // Formatted peso amount
                      }))
                    : []
                }
                maxHeight={280}
                colors={["#8B5CF6", "#A78BFA", "#C4B5FD", "#DDD6FE", "#EDE9FE"]}
              />

              {/* No data fallback */}
              {(!dashboardData.topProducts ||
                dashboardData.topProducts.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No sales data available</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Enhanced Stock Alerts */}
        {dashboardData.lowStockCount > 0 && (
          <section className="bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 rounded-2xl border border-amber-200 overflow-hidden shadow-lg">
            <div className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
                    <AlertTriangle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-amber-900">
                      Inventory Alerts
                    </h3>
                    <p className="text-amber-700">
                      Critical stock levels detected
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="px-4 py-2 bg-amber-200 text-amber-800 font-bold rounded-full text-sm">
                    {dashboardData.lowStockCount} items
                  </span>
                  <a
                    href="/inventory"
                    className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-2 rounded-xl hover:from-amber-700 hover:to-orange-700 transition-all duration-200 flex items-center space-x-2 font-semibold shadow-lg"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Review Inventory</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* System Status Footer */}
        <footer className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-600">
                  All systems operational
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Database className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-500">
                  Database: Connected
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Headphones className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-500">
                  Support: Available 24/7
                </span>
              </div>
            </div>
            <div className="text-xs text-gray-400">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

// Sub-components for better organization and reusability

const PerformanceStat = ({ icon: Icon, value, label, color }) => {
  const colorClasses = {
    blue: "bg-blue-600",
    green: "bg-green-600",
    purple: "bg-purple-600",
  };
  return (
    <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-100">
      <div
        className={`w-10 h-10 ${colorClasses[color]} rounded-lg flex items-center justify-center mx-auto mb-3`}
      >
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
};

const RecentSaleItem = ({ sale }) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-100">
    <div className="flex items-center space-x-3">
      <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center">
        <ShoppingCart className="h-4 w-4 text-white" />
      </div>
      <div>
        <p className="font-medium text-gray-900 text-sm">
          Sale #{sale.id?.toString().slice(-6)}
        </p>
        <p className="text-xs text-gray-500">
          {sale.customer_name || "Walk-in Customer"}
        </p>
      </div>
    </div>
    <div className="text-right">
      <p className="font-semibold text-gray-900 text-sm">
        {formatCurrency(sale.total_amount || 0)}
      </p>
      <p className="text-xs text-gray-500">
        {new Date(sale.created_at).toLocaleDateString()}
      </p>
    </div>
  </div>
);

function CleanMetricCard({
  title,
  value,
  icon: IconComponent,
  trend,
  trendText,
  color,
  isAlert = false,
  href,
  onClick,
}) {
  const colorClasses = {
    green: "bg-green-600",
    blue: "bg-blue-600",
    amber: "bg-amber-600",
    purple: "bg-purple-600",
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`bg-white rounded-xl shadow-sm border p-6 transition-all duration-200 ${
        isAlert ? "border-amber-200 bg-amber-50/20" : "border-gray-200"
      } ${
        href || onClick
          ? "cursor-pointer hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
          : "hover:shadow-md"
      }`}
      role={href || onClick ? "button" : undefined}
      tabIndex={href || onClick ? 0 : undefined}
      onKeyDown={
        href || onClick ? (e) => e.key === "Enter" && handleClick() : undefined
      }
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <IconComponent className="h-5 w-5 text-white" />
        </div>
        {trend !== null && trend !== undefined && (
          <div
            className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
              trend > 0
                ? "bg-green-100 text-green-700"
                : trend < 0
                ? "bg-red-100 text-red-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {trend > 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : trend < 0 ? (
              <TrendingDown className="h-3 w-3" />
            ) : (
              <Activity className="h-3 w-3" />
            )}
            <span>{Math.abs(trend).toFixed(1)}%</span>
          </div>
        )}
      </div>
      <div className="space-y-1">
        <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {trendText && <p className="text-gray-500 text-xs">{trendText}</p>}
      </div>
    </div>
  );
}

function CleanActionCard({
  icon: IconComponent,
  title,
  description,
  href,
  color,
  badge,
}) {
  const navigate = useNavigate();

  const colorClasses = {
    blue: "bg-blue-600",
    green: "bg-green-600",
    purple: "bg-purple-600",
    gray: "bg-gray-600",
    orange: "bg-orange-600",
  };

  return (
    <div
      onClick={() => navigate(href)}
      className="relative block group bg-white hover:bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-all duration-200 cursor-pointer"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && navigate(href)}
    >
      <div className="flex items-center space-x-3">
        {badge && (
          <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-medium px-2 py-0.5 rounded-full z-10">
            {badge}
          </div>
        )}
        <div
          className={`p-2 rounded-lg ${colorClasses[color]} group-hover:scale-105 transition-transform duration-200`}
        >
          <IconComponent className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 text-sm">{title}</h4>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all duration-200" />
      </div>
    </div>
  );
}

// Memoized components to prevent unnecessary re-renders
const MemoizedCleanMetricCard = React.memo(CleanMetricCard);
const MemoizedCleanActionCard = React.memo(CleanActionCard);
