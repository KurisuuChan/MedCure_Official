import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  ShoppingCart,
  Activity,
  Calendar,
  BarChart3,
  RefreshCw,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Info,
  ArrowLeft,
} from "lucide-react";
import { DemandForecastingService } from "../services/domains/analytics/demandForecastingService";
import { UnifiedSpinner } from "../components/ui/loading/UnifiedSpinner";
import { useToast } from "../components/ui/Toast";
import { supabase } from "../config/supabase";

/**
 * 📊 General Forecasting Dashboard
 * 
 * Shows overall pharmacy trends and predictions across all products
 */
const GeneralForecastingPage = () => {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [timeRange, setTimeRange] = useState(30); // 7, 30, 90 days
  const [chartMetric, setChartMetric] = useState('units'); // 'units' or 'revenue'
  const [hoveredPoint, setHoveredPoint] = useState(null);

  useEffect(() => {
    loadGeneralForecast();
    
    // Auto-refresh every 3 minutes
    const interval = setInterval(() => {
      loadGeneralForecast(true);
    }, 180000);
    
    return () => clearInterval(interval);
  }, [timeRange]);

  const loadGeneralForecast = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      // Get all products
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("*")
        .eq("status", "active");

      if (productsError) throw productsError;

      // Get sales history for time range
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeRange);

      const { data: salesData, error: salesError } = await supabase
        .from("sale_items")
        .select(`
          quantity,
          unit_price,
          created_at,
          product_id,
          sales!inner(
            created_at,
            status
          )
        `)
        .eq("sales.status", "completed")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: true });

      if (salesError) throw salesError;

      // Get all product forecasts
      const summary = await DemandForecastingService.getDemandSummary();

      // Calculate general metrics
      const metrics = calculateGeneralMetrics(products, salesData, timeRange);

      setData({
        products,
        sales: salesData,
        summary,
        metrics,
        lastUpdated: new Date(),
      });

      if (!silent) {
        success("General forecast loaded successfully!");
      }
    } catch (err) {
      console.error("Error loading general forecast:", err);
      if (!silent) {
        showError("Failed to load general forecast");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const calculateGeneralMetrics = (products, salesData, days) => {
    // Total products
    const totalProducts = products.length;

    // Total sales in period
    const totalUnits = salesData.reduce((sum, sale) => sum + (sale.quantity || 0), 0);
    const totalRevenue = salesData.reduce((sum, sale) => sum + (sale.quantity * sale.unit_price || 0), 0);

    // Daily averages
    const dailyUnits = totalUnits / days;
    const dailyRevenue = totalRevenue / days;

    // Calculate total inventory value
    const totalInventoryValue = products.reduce((sum, p) => {
      return sum + ((p.stock_in_pieces || 0) * (p.price_per_piece || 0));
    }, 0);

    // Calculate total inventory units
    const totalInventoryUnits = products.reduce((sum, p) => sum + (p.stock_in_pieces || 0), 0);

    // Products running low (less than reorder level)
    const lowStockProducts = products.filter(p => 
      (p.stock_in_pieces || 0) < (p.reorder_level || 100)
    ).length;

    // Out of stock products
    const outOfStockProducts = products.filter(p => (p.stock_in_pieces || 0) === 0).length;

    // Forecast next period
    const forecastNextPeriod = Math.round(dailyUnits * days);
    const forecastRevenue = Math.round(dailyRevenue * days);

    // Calculate trend (compare first half vs second half)
    const midPoint = Math.floor(salesData.length / 2);
    const firstHalfSales = salesData.slice(0, midPoint);
    const secondHalfSales = salesData.slice(midPoint);

    const firstHalfTotal = firstHalfSales.reduce((sum, s) => sum + s.quantity, 0);
    const secondHalfTotal = secondHalfSales.reduce((sum, s) => sum + s.quantity, 0);

    let trendPercentage = 0;
    let trendDirection = "stable";
    
    if (firstHalfTotal > 0) {
      trendPercentage = ((secondHalfTotal - firstHalfTotal) / firstHalfTotal) * 100;
      if (trendPercentage >= 10) {
        trendDirection = "increasing";
      } else if (trendPercentage <= -10) {
        trendDirection = "declining";
      }
    }

    // Calculate days of inventory remaining
    const daysOfInventory = dailyUnits > 0 ? Math.round(totalInventoryUnits / dailyUnits) : 999;

    // Group sales by day for chart
    const salesByDay = {};
    salesData.forEach(sale => {
      const date = new Date(sale.created_at).toDateString();
      if (!salesByDay[date]) {
        salesByDay[date] = { units: 0, revenue: 0 };
      }
      salesByDay[date].units += sale.quantity;
      salesByDay[date].revenue += sale.quantity * sale.unit_price;
    });

    // Get historical data for line chart (based on days selected)
    const historicalData = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();
      historicalData.push({
        date: dateStr,
        dateObj: new Date(date),
        units: salesByDay[dateStr]?.units || 0,
        revenue: salesByDay[dateStr]?.revenue || 0,
        day: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        isPrediction: false,
      });
    }

    // Add prediction data points with trend-based growth/decline
    const predictionDays = Math.min(days, 30); // Predict same range or max 30 days
    const dailyTrendRate = trendPercentage / 100 / days; // Daily trend rate
    
    for (let i = 1; i <= predictionDays; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dateStr = date.toDateString();
      
      // Apply cumulative trend growth/decline each day
      const trendFactor = 1 + (dailyTrendRate * i);
      const predictedUnits = Math.max(0, Math.round(dailyUnits * trendFactor));
      const predictedRevenue = Math.max(0, Math.round(dailyRevenue * trendFactor));
      
      historicalData.push({
        date: dateStr,
        dateObj: new Date(date),
        units: predictedUnits,
        revenue: predictedRevenue,
        day: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        isPrediction: true,
      });
    }

    // Get last 7 days for bar chart
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();
      last7Days.push({
        date: dateStr,
        units: salesByDay[dateStr]?.units || 0,
        revenue: salesByDay[dateStr]?.revenue || 0,
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      });
    }

    return {
      totalProducts,
      totalUnits,
      totalRevenue,
      dailyUnits: Math.round(dailyUnits * 10) / 10,
      dailyRevenue: Math.round(dailyRevenue),
      totalInventoryValue: Math.round(totalInventoryValue),
      totalInventoryUnits,
      lowStockProducts,
      outOfStockProducts,
      forecastNextPeriod,
      forecastRevenue,
      trendPercentage: Math.round(trendPercentage),
      trendDirection,
      daysOfInventory,
      last7Days,
      historicalData,
      predictionDays,
    };
  };

  const getTrendIcon = () => {
    if (!data) return <Minus className="w-5 h-5" />;
    switch (data.metrics.trendDirection) {
      case "increasing":
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case "declining":
        return <TrendingDown className="w-5 h-5 text-orange-600" />;
      default:
        return <Minus className="w-5 h-5 text-blue-600" />;
    }
  };

  const getTrendColor = () => {
    if (!data) return "text-blue-600";
    switch (data.metrics.trendDirection) {
      case "increasing":
        return "text-green-600";
      case "declining":
        return "text-orange-600";
      default:
        return "text-blue-600";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <UnifiedSpinner variant="dots" size="lg" color="blue" />
          <p className="mt-4 text-gray-600">Loading general forecast...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Failed to load data</p>
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
              {/* Back Button */}
              <button
                onClick={() => navigate('/forecasting')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
                title="Back to Product Forecasting"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:text-indigo-600" />
              </button>
              
              <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-sm">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Overall Pharmacy Forecast
                </h1>
                <p className="text-sm text-gray-500">
                  Big-picture view of your entire inventory
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Time Range Selector */}
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              >
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
              </select>
              <button
                onClick={() => loadGeneralForecast()}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-sm"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Main Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Sales */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">Total Sales ({timeRange} days)</span>
              <div className="p-2 bg-blue-50 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {data.metrics.totalUnits.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">units sold</div>
            <div className="mt-2 text-xs text-blue-600">
              ~{data.metrics.dailyUnits} units/day average
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">Total Revenue</span>
              <div className="p-2 bg-green-50 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              ₱{data.metrics.totalRevenue.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">in {timeRange} days</div>
            <div className="mt-2 text-xs text-green-600">
              ~₱{data.metrics.dailyRevenue.toLocaleString()}/day average
            </div>
          </div>

          {/* Overall Trend */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">Overall Trend</span>
              <div className={`p-2 rounded-lg ${
                data.metrics.trendDirection === 'increasing' ? 'bg-green-50' :
                data.metrics.trendDirection === 'declining' ? 'bg-orange-50' : 'bg-blue-50'
              }`}>
                {getTrendIcon()}
              </div>
            </div>
            <div className={`text-3xl font-bold mb-1 ${getTrendColor()}`}>
              {data.metrics.trendPercentage > 0 ? '+' : ''}{data.metrics.trendPercentage}%
            </div>
            <div className="text-sm text-gray-500 capitalize">{data.metrics.trendDirection}</div>
            <div className="mt-2 text-xs text-gray-600">
              Comparing first vs second half
            </div>
          </div>

          {/* Inventory Value */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">Inventory Value</span>
              <div className="p-2 bg-purple-50 rounded-lg">
                <Activity className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              ₱{data.metrics.totalInventoryValue.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">current stock</div>
            <div className="mt-2 text-xs text-purple-600">
              {data.metrics.totalInventoryUnits.toLocaleString()} units on hand
            </div>
          </div>
        </div>

        {/* Forecast Section */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 p-6 mb-6 shadow-sm">
          <div className="flex items-start gap-4">
            <Calendar className="w-8 h-8 text-indigo-600 mt-1" />
            <div className="flex-1">
              <h2 className="text-xl font-bold text-indigo-900 mb-4">Next {timeRange} Days Forecast</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/70 rounded-lg p-4">
                  <div className="text-sm text-indigo-600 font-medium mb-2">Expected Sales</div>
                  <div className="text-3xl font-bold text-indigo-900 mb-1">
                    {data.metrics.forecastNextPeriod.toLocaleString()}
                  </div>
                  <div className="text-xs text-indigo-700">units will sell</div>
                </div>
                <div className="bg-white/70 rounded-lg p-4">
                  <div className="text-sm text-green-600 font-medium mb-2">Expected Revenue</div>
                  <div className="text-3xl font-bold text-green-900 mb-1">
                    ₱{data.metrics.forecastRevenue.toLocaleString()}
                  </div>
                  <div className="text-xs text-green-700">estimated income</div>
                </div>
                <div className="bg-white/70 rounded-lg p-4">
                  <div className="text-sm text-orange-600 font-medium mb-2">Inventory Duration</div>
                  <div className="text-3xl font-bold text-orange-900 mb-1">
                    {data.metrics.daysOfInventory}
                  </div>
                  <div className="text-xs text-orange-700">days until empty</div>
                </div>
              </div>
              <div className="mt-4 text-sm text-indigo-800 bg-white/50 rounded p-3">
                💡 <strong>Based on current sales rate:</strong> Your inventory will last {data.metrics.daysOfInventory} days. 
                {data.metrics.daysOfInventory < 30 && " ⚠️ Consider ordering more stock soon!"}
                {data.metrics.daysOfInventory >= 30 && data.metrics.daysOfInventory < 60 && " 👍 Good stock level!"}
                {data.metrics.daysOfInventory >= 60 && " ✅ Excellent stock coverage!"}
              </div>
            </div>
          </div>
        </div>

        {/* Sales Trend Line Graph - Simplified */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Sales History & Forecast</h2>
            <div className="flex items-center gap-4">
              {/* Metric Filter */}
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setChartMetric('units')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    chartMetric === 'units'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Units
                </button>
                <button
                  onClick={() => setChartMetric('revenue')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    chartMetric === 'revenue'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Revenue (₱)
                </button>
              </div>
              
              {/* Legend */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-indigo-600 rounded-full"></div>
                  <span className="text-gray-600">Actual Sales</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full opacity-50"></div>
                  <span className="text-gray-600">Predicted</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Simplified Line Chart */}
          <div className="relative h-80">
            {/* Y-axis */}
            <div className="absolute left-0 top-0 bottom-12 w-12 flex flex-col justify-between text-xs text-gray-500 text-right pr-2">
              {(() => {
                const maxValue = Math.max(...data.metrics.historicalData.map(d => d[chartMetric]), 1);
                return [100, 75, 50, 25, 0].map((percent, idx) => {
                  const value = Math.round((maxValue * percent) / 100);
                  return (
                    <div key={idx} className="leading-none">
                      {chartMetric === 'revenue' ? `₱${value}` : value}
                    </div>
                  );
                });
              })()}
            </div>

            {/* Chart container */}
            <div className="ml-12 h-full relative">
              {/* Hover Tooltip */}
              {hoveredPoint && (
                <div 
                  className="absolute z-50 pointer-events-none"
                  style={{
                    left: `${hoveredPoint.svgX}px`,
                    top: `${hoveredPoint.svgY}px`,
                    transform: 'translate(-50%, calc(-100% - 15px))'
                  }}
                >
                  <div className="bg-gray-900 text-white px-4 py-3 rounded-lg shadow-2xl text-sm whitespace-nowrap">
                    <div className="font-semibold text-center mb-2 border-b border-gray-700 pb-2">
                      {hoveredPoint.day}
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between gap-6">
                        <span className="text-gray-300">Units:</span>
                        <span className="font-bold">{hoveredPoint.units.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between gap-6">
                        <span className="text-gray-300">Revenue:</span>
                        <span className="font-bold text-green-400">₱{hoveredPoint.revenue.toLocaleString()}</span>
                      </div>
                      {hoveredPoint.isPrediction && (
                        <div className="text-xs text-orange-400 text-center mt-2 pt-2 border-t border-gray-700">
                          📊 Predicted
                        </div>
                      )}
                    </div>
                    {/* Arrow pointer */}
                    <div className="absolute left-1/2 bottom-0 transform translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-gray-900 rotate-45"></div>
                  </div>
                </div>
              )}

              {/* Grid */}
              <div className="absolute left-0 right-0 top-0 bottom-12 flex flex-col justify-between pointer-events-none">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="border-t border-gray-200"></div>
                ))}
              </div>

              {/* SVG Chart */}
              <svg 
                className="w-full h-full" 
                style={{ maxHeight: 'calc(100% - 3rem)' }} 
                viewBox="0 0 1000 300" 
                preserveAspectRatio="xMidYMid meet"
                ref={(el) => {
                  if (el) {
                    // Store SVG element for coordinate calculations
                    el._svgBounds = el.getBoundingClientRect();
                  }
                }}
              >
                <defs>
                  {/* Smooth gradient fills */}
                  <linearGradient id="actualFill" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
                  </linearGradient>
                  <linearGradient id="predictFill" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#f97316" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#f97316" stopOpacity="0.02" />
                  </linearGradient>
                </defs>

                {(() => {
                  const chartData = data.metrics.historicalData;
                  const metric = chartMetric; // 'units' or 'revenue'
                  const maxValue = Math.max(...chartData.map(d => d[metric]), 1);
                  const width = 1000;
                  const height = 300;
                  const padding = 20;
                  
                  // Split data
                  const actualData = chartData.filter(d => !d.isPrediction);
                  const predictData = chartData.filter(d => d.isPrediction);
                  
                  // Add connection point
                  if (predictData.length > 0 && actualData.length > 0) {
                    predictData.unshift(actualData[actualData.length - 1]);
                  }

                  // Generate points
                  const actualPoints = actualData.map((d, i) => {
                    const x = (i / (chartData.length - 1)) * (width - padding * 2) + padding;
                    const y = height - padding - ((d[metric] / maxValue) * (height - padding * 2));
                    return { x, y, value: d[metric], day: d.day };
                  });

                  const predictPoints = predictData.map((d, i) => {
                    const baseIdx = actualData.length - 1;
                    const x = ((baseIdx + i) / (chartData.length - 1)) * (width - padding * 2) + padding;
                    const y = height - padding - ((d[metric] / maxValue) * (height - padding * 2));
                    return { x, y, value: d[metric], day: d.day };
                  });

                  // Create smooth paths
                  const actualPath = actualPoints.length > 0 ? 
                    actualPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ') : '';
                  
                  const predictPath = predictPoints.length > 0 ?
                    predictPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ') : '';

                  // Area fills
                  const actualArea = actualPath ? 
                    `${actualPath} L ${actualPoints[actualPoints.length - 1].x},${height - padding} L ${padding},${height - padding} Z` : '';
                  
                  const predictArea = predictPath && predictPoints.length > 1 ?
                    `${predictPath} L ${predictPoints[predictPoints.length - 1].x},${height - padding} L ${predictPoints[0].x},${height - padding} Z` : '';

                  return (
                    <>
                      {/* Actual data area */}
                      {actualArea && (
                        <path d={actualArea} fill="url(#actualFill)" />
                      )}
                      
                      {/* Prediction area */}
                      {predictArea && (
                        <path d={predictArea} fill="url(#predictFill)" />
                      )}

                      {/* Actual line */}
                      {actualPath && (
                        <path 
                          d={actualPath} 
                          fill="none" 
                          stroke="#6366f1" 
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      )}

                      {/* Prediction line (dashed) */}
                      {predictPath && predictPoints.length > 1 && (
                        <path 
                          d={predictPath} 
                          fill="none" 
                          stroke="#f97316" 
                          strokeWidth="3"
                          strokeDasharray="10,5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          opacity="0.8"
                        />
                      )}

                      {/* Actual data points */}
                      {actualPoints.map((p, i) => {
                        const dataPoint = actualData[i];
                        return (
                          <g key={`a-${i}`}>
                            {/* Invisible larger circle for easier hovering */}
                            <circle 
                              cx={p.x} 
                              cy={p.y} 
                              r="15" 
                              fill="transparent"
                              style={{ cursor: 'pointer' }}
                              onMouseEnter={(e) => {
                                const svg = e.currentTarget.ownerSVGElement;
                                const svgRect = svg.getBoundingClientRect();
                                const svgX = (p.x / width) * svgRect.width;
                                const svgY = (p.y / height) * svgRect.height;
                                
                                setHoveredPoint({
                                  svgX,
                                  svgY,
                                  day: p.day,
                                  units: dataPoint.units,
                                  revenue: dataPoint.revenue,
                                  isPrediction: false
                                });
                              }}
                              onMouseLeave={() => setHoveredPoint(null)}
                            />
                            {/* Visible dot */}
                            <circle 
                              cx={p.x} 
                              cy={p.y} 
                              r="5" 
                              fill="white" 
                              stroke="#6366f1" 
                              strokeWidth="2.5"
                              style={{ pointerEvents: 'none' }}
                              className={hoveredPoint?.day === p.day && !hoveredPoint?.isPrediction ? 'r-7' : ''}
                            />
                          </g>
                        );
                      })}

                      {/* Prediction points */}
                      {predictPoints.map((p, i) => {
                        if (i === 0) return null;
                        const dataPoint = predictData[i];
                        return (
                          <g key={`p-${i}`}>
                            {/* Invisible larger circle for easier hovering */}
                            <circle 
                              cx={p.x} 
                              cy={p.y} 
                              r="15" 
                              fill="transparent"
                              style={{ cursor: 'pointer' }}
                              onMouseEnter={(e) => {
                                const svg = e.currentTarget.ownerSVGElement;
                                const svgRect = svg.getBoundingClientRect();
                                const svgX = (p.x / width) * svgRect.width;
                                const svgY = (p.y / height) * svgRect.height;
                                
                                setHoveredPoint({
                                  svgX,
                                  svgY,
                                  day: p.day,
                                  units: dataPoint.units,
                                  revenue: dataPoint.revenue,
                                  isPrediction: true
                                });
                              }}
                              onMouseLeave={() => setHoveredPoint(null)}
                            />
                            {/* Visible dot */}
                            <circle 
                              cx={p.x} 
                              cy={p.y} 
                              r="5" 
                              fill="white" 
                              stroke="#f97316" 
                              strokeWidth="2.5"
                              opacity="0.8"
                              style={{ pointerEvents: 'none' }}
                              className={hoveredPoint?.day === p.day && hoveredPoint?.isPrediction ? 'r-7' : ''}
                            />
                          </g>
                        );
                      })}
                    </>
                  );
                })()}
              </svg>

              {/* X-axis labels */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 px-2">
                <span className="font-medium">{data.metrics.historicalData[0]?.day}</span>
                <span className="text-orange-600 font-semibold">Forecast →</span>
                <span className="font-medium">{data.metrics.historicalData[data.metrics.historicalData.length - 1]?.day}</span>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
              <div className="text-indigo-600 font-semibold mb-1 text-sm">Past {timeRange} Days</div>
              <div className="text-3xl font-bold text-indigo-900">{data.metrics.totalUnits.toLocaleString()}</div>
              <div className="text-xs text-indigo-600 mt-1">units sold</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
              <div className="text-orange-600 font-semibold mb-1 text-sm">Next {data.metrics.predictionDays} Days</div>
              <div className="text-3xl font-bold text-orange-900">{data.metrics.forecastNextPeriod.toLocaleString()}</div>
              <div className="text-xs text-orange-600 mt-1">predicted sales</div>
            </div>
            <div className={`rounded-lg p-4 border ${
              data.metrics.trendDirection === 'increasing' ? 'bg-green-50 border-green-100' :
              data.metrics.trendDirection === 'declining' ? 'bg-red-50 border-red-100' : 
              'bg-blue-50 border-blue-100'
            }`}>
              <div className={`font-semibold mb-1 text-sm ${
                data.metrics.trendDirection === 'increasing' ? 'text-green-600' :
                data.metrics.trendDirection === 'declining' ? 'text-red-600' : 'text-blue-600'
              }`}>
                Trend
              </div>
              <div className={`text-3xl font-bold ${
                data.metrics.trendDirection === 'increasing' ? 'text-green-900' :
                data.metrics.trendDirection === 'declining' ? 'text-red-900' : 'text-blue-900'
              }`}>
                {data.metrics.trendPercentage > 0 ? '+' : ''}{data.metrics.trendPercentage}%
              </div>
              <div className={`text-xs mt-1 capitalize ${
                data.metrics.trendDirection === 'increasing' ? 'text-green-600' :
                data.metrics.trendDirection === 'declining' ? 'text-red-600' : 'text-blue-600'
              }`}>
                {data.metrics.trendDirection}
              </div>
            </div>
          </div>
        </div>

        {/* 7-Day Bar Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Last 7 Days Sales Trend</h2>
          <div className="flex items-end justify-between gap-3 h-48 bg-gradient-to-b from-gray-50 to-white rounded-lg p-4 border border-gray-100">
            {data.metrics.last7Days.map((day, index) => {
              const maxValue = Math.max(...data.metrics.last7Days.map(d => d.units));
              const height = maxValue > 0 ? (day.units / maxValue) * 100 : 0;
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2 group relative">
                  {/* Tooltip */}
                  <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    <div className="font-semibold">{day.day}</div>
                    <div>{day.units} units</div>
                    <div>₱{day.revenue.toLocaleString()}</div>
                  </div>
                  
                  {/* Value Label */}
                  <div className="text-xs font-semibold text-gray-700 mb-1">
                    {day.units}
                  </div>
                  
                  {/* Bar */}
                  <div className="w-full flex flex-col justify-end items-center" style={{ height: '120px' }}>
                    <div
                      className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t hover:from-indigo-700 hover:to-indigo-500 transition-all cursor-pointer shadow-sm"
                      style={{ 
                        height: `${Math.max(height, 5)}%`,
                      }}
                    />
                  </div>
                  
                  {/* Day Label */}
                  <div className="text-xs font-medium text-gray-600 mt-1">
                    {day.day}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Alerts & Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Low Stock Alert */}
          <div className={`rounded-xl border p-5 shadow-sm ${
            data.metrics.lowStockProducts > 0 
              ? 'bg-orange-50 border-orange-200' 
              : 'bg-green-50 border-green-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Low Stock Products</span>
              <AlertCircle className={`w-5 h-5 ${
                data.metrics.lowStockProducts > 0 ? 'text-orange-600' : 'text-green-600'
              }`} />
            </div>
            <div className={`text-3xl font-bold mb-1 ${
              data.metrics.lowStockProducts > 0 ? 'text-orange-900' : 'text-green-900'
            }`}>
              {data.metrics.lowStockProducts}
            </div>
            <div className="text-xs text-gray-600">
              {data.metrics.lowStockProducts === 0 ? "All good! ✅" : "Need reordering ⚠️"}
            </div>
          </div>

          {/* Out of Stock */}
          <div className={`rounded-xl border p-5 shadow-sm ${
            data.metrics.outOfStockProducts > 0 
              ? 'bg-red-50 border-red-200' 
              : 'bg-green-50 border-green-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Out of Stock</span>
              <Package className={`w-5 h-5 ${
                data.metrics.outOfStockProducts > 0 ? 'text-red-600' : 'text-green-600'
              }`} />
            </div>
            <div className={`text-3xl font-bold mb-1 ${
              data.metrics.outOfStockProducts > 0 ? 'text-red-900' : 'text-green-900'
            }`}>
              {data.metrics.outOfStockProducts}
            </div>
            <div className="text-xs text-gray-600">
              {data.metrics.outOfStockProducts === 0 ? "None! ✅" : "Order now! 🚨"}
            </div>
          </div>

          {/* High Demand */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">High Demand</span>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-green-900 mb-1">
              {data.summary?.highDemand || 0}
            </div>
            <div className="text-xs text-gray-600">Best sellers 🔥</div>
          </div>

          {/* Trending Up */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Trending Up</span>
              <ArrowUpRight className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-blue-900 mb-1">
              {data.summary?.trending || 0}
            </div>
            <div className="text-xs text-gray-600">Growing sales 📈</div>
          </div>
        </div>

        {/* Last Updated */}
        <div className="mt-6 text-center text-sm text-gray-500">
          Last updated: {data.lastUpdated.toLocaleString()} • Auto-refreshes every 3 minutes
        </div>
      </div>
    </div>
  );
};

export default GeneralForecastingPage;
