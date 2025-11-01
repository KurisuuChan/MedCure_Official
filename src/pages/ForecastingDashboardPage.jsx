import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  TrendingDown,
  Package,
  Search,
  RefreshCw,
  BarChart3,
  AlertTriangle,
  ArrowUpRight,
  Minus,
  ChevronLeft,
  ChevronRight,
  Activity,
  Clock,
  ShoppingCart,
  Globe,
} from "lucide-react";
import { DemandForecastingService } from "../services/domains/analytics/demandForecastingService";
import { UnifiedSpinner } from "../components/ui/loading/UnifiedSpinner";
import DemandForecastingPanel from "../components/analytics/DemandForecastingPanel";
import { useToast } from "../components/ui/Toast";

/**
 * 📊 Demand Forecasting Dashboard
 * 
 * Comprehensive view of demand forecasts across all products with
 * filtering, sorting, pagination and real-time updates.
 */
const ForecastingDashboardPage = () => {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [forecasts, setForecasts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDemand, setFilterDemand] = useState("all");
  const [filterTrend, setFilterTrend] = useState("all");
  const [sortBy, setSortBy] = useState("demand"); // demand, trend, stock
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  useEffect(() => {
    loadDashboardData();
    
    // Auto-refresh every 2 minutes to catch new sales
    const interval = setInterval(() => {
      loadDashboardData(true); // Silent refresh
    }, 120000);
    
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      
      // Load summary
      const summaryData = await DemandForecastingService.getDemandSummary();
      setSummary(summaryData);

      // Load ALL products (no limit)
      const allProducts = await DemandForecastingService.getAllProductForecasts();
      setForecasts(allProducts);
      
      if (!silent) {
        success(`Forecasts loaded for ${allProducts.length} products!`);
      }
    } catch (err) {
      console.error("Error loading dashboard:", err);
      if (!silent) {
        showError("Failed to load forecasting data");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleRefresh = () => {
    setCurrentPage(1); // Reset to page 1
    loadDashboardData();
  };

  const filteredForecasts = forecasts
    .filter(f => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        f.productName.toLowerCase().includes(searchLower) ||
        f.category?.toLowerCase().includes(searchLower);

      // Demand filter
      const matchesDemand = filterDemand === "all" || f.demandLevel === filterDemand;

      // Trend filter
      const matchesTrend = filterTrend === "all" || f.trend === filterTrend;

      return matchesSearch && matchesDemand && matchesTrend;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "demand":
          return b.dailyAverage - a.dailyAverage;
        case "trend":
          return b.trendPercentage - a.trendPercentage;
        case "stock":
          return a.daysOfStock - b.daysOfStock;
        case "reorder":
          return (b.reorderSuggestion?.shouldReorder ? 1 : 0) - 
                 (a.reorderSuggestion?.shouldReorder ? 1 : 0);
        default:
          return 0;
      }
    });

  // Pagination calculations
  const totalPages = Math.ceil(filteredForecasts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedForecasts = filteredForecasts.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterDemand, filterTrend, sortBy]);

  const getTrendIcon = (trend) => {
    switch (trend) {
      case "Increasing":
        return <TrendingUp className="w-4 h-4" />;
      case "Declining":
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Minus className="w-4 h-4" />;
    }
  };

  const getDemandBadgeColor = (level) => {
    switch (level) {
      case "High":
        return "bg-green-100 text-green-700 border-green-200";
      case "Medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "Low":
        return "bg-orange-100 text-orange-700 border-orange-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getTrendBadgeColor = (trend) => {
    switch (trend) {
      case "Increasing":
        return "bg-green-100 text-green-700";
      case "Declining":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-blue-100 text-blue-700";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <UnifiedSpinner variant="dots" size="lg" color="blue" />
          <p className="mt-4 text-gray-600">Loading demand forecasts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Demand Forecasting
                </h1>
                <p className="text-sm text-gray-500">
                  AI-powered inventory predictions
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/forecasting/general')}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">Overall View</span>
              </button>
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600">Best Sellers</span>
                <div className="p-2 bg-green-50 rounded-lg">
                  <Activity className="w-4 h-4 text-green-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {summary.highDemand}
              </div>
              <div className="text-xs text-gray-500 mt-1">selling fast 🔥</div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600">Growing Sales</span>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {summary.trending}
              </div>
              <div className="text-xs text-gray-500 mt-1">getting popular 📈</div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600">Need to Order</span>
                <div className="p-2 bg-orange-50 rounded-lg">
                  <ShoppingCart className="w-4 h-4 text-orange-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {summary.needsReorder}
              </div>
              <div className="text-xs text-gray-500 mt-1">running low 📦</div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600">Urgent Orders</span>
                <div className="p-2 bg-red-50 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {summary.criticalStock}
              </div>
              <div className="text-xs text-gray-500 mt-1">order now! ⚠️</div>
            </div>
          </div>
        )}

        {/* Filters & Search */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Demand Filter */}
            <select
              value={filterDemand}
              onChange={(e) => setFilterDemand(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="all">All Demand</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
              <option value="No Demand">None</option>
            </select>

            {/* Trend Filter */}
            <select
              value={filterTrend}
              onChange={(e) => setFilterTrend(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="all">All Trends</option>
              <option value="Increasing">Increasing</option>
              <option value="Stable">Stable</option>
              <option value="Declining">Declining</option>
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="demand">Sort: Demand</option>
              <option value="trend">Sort: Trend</option>
              <option value="stock">Sort: Stock</option>
              <option value="reorder">Sort: Reorder</option>
            </select>
          </div>

          <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing {startIndex + 1}-{Math.min(endIndex, filteredForecasts.length)} of {filteredForecasts.length} products
            </span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="text-xs border border-gray-300 rounded px-2 py-1"
            >
              <option value="12">12 per page</option>
              <option value="24">24 per page</option>
              <option value="48">48 per page</option>
              <option value="96">96 per page</option>
            </select>
          </div>
        </div>

        {/* Forecast Cards - Compact Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
          {paginatedForecasts.map((forecast) => (
            <div
              key={forecast.productId}
              onClick={() => setSelectedProduct(forecast.productId)}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer group"
            >
              {/* Product Name */}
              <div className="mb-3">
                <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {forecast.productName}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">{forecast.category}</p>
              </div>

              {/* Badges Row */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getDemandBadgeColor(forecast.demandLevel)}`}>
                  <Activity className="w-3 h-3" />
                  {forecast.demandLevel}
                </span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getTrendBadgeColor(forecast.trend)}`}>
                  {getTrendIcon(forecast.trend)}
                  {forecast.trendPercentage > 0 ? "+" : ""}{forecast.trendPercentage}%
                </span>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-gray-500 mb-0.5">Daily Avg</div>
                  <div className="font-bold text-gray-900">{forecast.dailyAverage}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-gray-500 mb-0.5">Stock Days</div>
                  <div className={`font-bold ${
                    forecast.daysOfStock <= 3 ? "text-red-600" :
                    forecast.daysOfStock <= 7 ? "text-orange-600" :
                    "text-green-600"
                  }`}>
                    {forecast.daysOfStock}d
                  </div>
                </div>
              </div>

              {/* 30-Day Forecast */}
              <div className="bg-blue-50 rounded-lg p-2 mb-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-blue-600 font-medium">30-Day Forecast</span>
                  <span className="text-sm font-bold text-blue-900">{forecast.forecastTotal}</span>
                </div>
              </div>

              {/* Reorder Alert */}
              {forecast.reorderSuggestion?.shouldReorder && (
                <div className={`rounded-lg p-2 text-xs flex items-start gap-1.5 ${
                  forecast.reorderSuggestion.urgency === "critical"
                    ? "bg-red-50 border border-red-200 text-red-800"
                    : forecast.reorderSuggestion.urgency === "high"
                    ? "bg-orange-50 border border-orange-200 text-orange-800"
                    : "bg-yellow-50 border border-yellow-200 text-yellow-800"
                }`}>
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">Reorder {forecast.reorderSuggestion.suggestedQuantity} units</div>
                    {forecast.reorderSuggestion.daysUntilStockOut !== undefined && (
                      <div className="text-xs opacity-90 mt-0.5">
                        {forecast.reorderSuggestion.daysUntilStockOut} days until stockout
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Seasonal Badge */}
              {forecast.isSeasonal && (
                <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-700">
                  <Sparkles className="w-3 h-3" />
                  Seasonal
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-1">
              {[...Array(totalPages)].map((_, i) => {
                const page = i + 1;
                // Show first, last, current, and pages around current
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-[40px] h-10 rounded-lg font-medium text-sm transition-colors ${
                        currentPage === page
                          ? "bg-blue-600 text-white"
                          : "border border-gray-300 hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      {page}
                    </button>
                  );
                } else if (
                  page === currentPage - 2 ||
                  page === currentPage + 2
                ) {
                  return <span key={page} className="px-1 text-gray-400">...</span>;
                }
                return null;
              })}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Empty State */}
        {filteredForecasts.length === 0 && !loading && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No forecasts found
            </h3>
            <p className="text-gray-600">
              Try adjusting your filters or search terms
            </p>
          </div>
        )}
      </div>

      {/* Detailed Forecast Modal */}
      {selectedProduct && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedProduct(null);
          }}
        >
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-semibold text-gray-900">
                Detailed Forecast Analysis
              </h2>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <DemandForecastingPanel productId={selectedProduct} onDataUpdate={handleRefresh} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForecastingDashboardPage;
