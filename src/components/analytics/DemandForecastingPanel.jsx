import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  BarChart3,
  Calendar,
  Package,
  RefreshCw,
  Info,
  Activity,
  Clock,
  DollarSign,
  Box,
  Sparkles,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { DemandForecastingService } from "../../services/domains/analytics/demandForecastingService";
import { UnifiedSpinner } from "../ui/loading/UnifiedSpinner";

/**
 * 📊 Demand Forecasting Panel
 * 
 * Displays intelligent demand predictions, trends, and reorder suggestions
 * for inventory management.
 */
const DemandForecastingPanel = ({ productId, compact = false, onDataUpdate }) => {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (productId) {
      loadForecast();
    }
  }, [productId]);

  const loadForecast = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await DemandForecastingService.getForecast(productId, 30);
      setForecast(data);
    } catch (err) {
      console.error("Error loading forecast:", err);
      setError(err.message || "Failed to load forecast");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadForecast();
    // Notify parent to refresh if callback provided
    if (onDataUpdate) {
      onDataUpdate();
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case "Increasing":
        return <TrendingUp className="w-5 h-5" />;
      case "Declining":
        return <TrendingDown className="w-5 h-5" />;
      default:
        return <Minus className="w-5 h-5" />;
    }
  };

  const getDemandColor = (level) => {
    switch (level) {
      case "High":
        return "text-green-700 bg-green-50 border-green-200";
      case "Medium":
        return "text-yellow-700 bg-yellow-50 border-yellow-200";
      case "Low":
        return "text-orange-700 bg-orange-50 border-orange-200";
      default:
        return "text-gray-700 bg-gray-50 border-gray-200";
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case "Increasing":
        return "text-green-700 bg-green-50 border-green-200";
      case "Declining":
        return "text-orange-700 bg-orange-50 border-orange-200";
      default:
        return "text-blue-700 bg-blue-50 border-blue-200";
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case "critical":
        return "bg-red-600 text-white";
      case "high":
        return "bg-orange-600 text-white";
      case "medium":
        return "bg-yellow-500 text-white";
      default:
        return "bg-green-600 text-white";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <UnifiedSpinner variant="dots" size="md" color="blue" />
        <span className="ml-3 text-gray-600">Loading forecast...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-800">Error Loading Forecast</h4>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <button
              onClick={loadForecast}
              className="mt-2 text-sm text-red-700 hover:text-red-900 underline"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!forecast) {
    return (
      <div className="text-center text-gray-500 py-8">
        No forecast data available
      </div>
    );
  }

  // Compact view for product cards
  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className={`w-5 h-5 ${
              forecast.demandLevel === "High" ? "text-green-600" :
              forecast.demandLevel === "Medium" ? "text-yellow-600" :
              "text-orange-600"
            }`} />
            <div>
              <div className="text-sm font-medium text-gray-900">
                {forecast.demandLevel} Demand
              </div>
              <div className="text-xs text-gray-500">
                ~{forecast.dailyAverage} units/day
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className={`flex items-center gap-1 text-sm font-medium ${
              forecast.trend === "Increasing" ? "text-green-600" :
              forecast.trend === "Declining" ? "text-orange-600" : "text-blue-600"
            }`}>
              {getTrendIcon(forecast.trend)}
              <span>{forecast.trendPercentage > 0 ? "+" : ""}{forecast.trendPercentage}%</span>
            </div>
            <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1 justify-end">
              <Clock className="w-3 h-3" />
              {forecast.daysOfStock} days left
            </div>
          </div>
        </div>

        {forecast.reorderSuggestion?.shouldReorder && (
          <div className={`flex items-center gap-2 text-xs px-2 py-1 rounded ${getUrgencyColor(forecast.reorderSuggestion.urgency)}`}>
            <AlertCircle className="w-3.5 h-3.5" />
            {forecast.reorderSuggestion.message}
          </div>
        )}
      </div>
    );
  }

  // Full detailed view
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Demand Forecast</h3>
              <p className="text-sm text-gray-500">{forecast.productName}</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh forecast"
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Simple Explanation Banner */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">How This Works</h4>
              <p className="text-sm text-blue-800">
                Our AI analyzes your past {forecast.dataPoints} sales to predict future demand. 
                This helps you know <strong>when to reorder</strong> and <strong>how much to buy</strong> 
                so you never run out of stock.
              </p>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Demand Level */}
          <div className={`border rounded-lg p-3 ${getDemandColor(forecast.demandLevel)}`}>
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-7 h-7" />
            </div>
            <div className="text-lg font-bold">{forecast.demandLevel}</div>
            <div className="text-xs opacity-80">How Popular</div>
          </div>

          {/* Trend */}
          <div className={`border rounded-lg p-3 ${getTrendColor(forecast.trend)}`}>
            <div className="flex items-center justify-between mb-2">
              <div>{getTrendIcon(forecast.trend)}</div>
            </div>
            <div className="text-lg font-bold">{forecast.trend}</div>
            <div className="text-xs opacity-80">
              {forecast.trendPercentage > 0 ? "+" : ""}{forecast.trendPercentage}% vs last week
            </div>
          </div>

          {/* Daily Average */}
          <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <Box className="w-7 h-7 text-gray-600" />
            </div>
            <div className="text-lg font-bold">{forecast.dailyAverage}</div>
            <div className="text-xs text-gray-600">Sells Per Day</div>
          </div>

          {/* Stock Status */}
          <div className={`border rounded-lg p-3 ${
            forecast.daysOfStock <= 3 ? "bg-red-50 border-red-200 text-red-700" :
            forecast.daysOfStock <= 7 ? "bg-orange-50 border-orange-200 text-orange-700" :
            forecast.daysOfStock <= 14 ? "bg-yellow-50 border-yellow-200 text-yellow-700" :
            "bg-green-50 border-green-200 text-green-700"
          }`}>
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-7 h-7" />
            </div>
            <div className="text-lg font-bold">{forecast.daysOfStock}</div>
            <div className="text-xs opacity-80">Days Until Empty</div>
          </div>
        </div>

        {/* 30-Day Forecast Summary */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-start gap-3">
            <Calendar className="w-6 h-6 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 mb-3">What to Expect in the Next 30 Days</h4>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="bg-white/50 rounded-lg p-3">
                  <div className="flex items-center gap-1 text-blue-600 font-medium mb-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Most Likely
                  </div>
                  <div className="text-2xl font-bold text-blue-900">
                    {forecast.forecastTotal}
                  </div>
                  <div className="text-xs text-blue-700 mt-1">units will sell</div>
                </div>
                <div className="bg-white/50 rounded-lg p-3">
                  <div className="flex items-center gap-1 text-green-600 font-medium mb-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    If Sales Increase
                  </div>
                  <div className="text-2xl font-bold text-green-900">
                    {forecast.forecastRange.high}
                  </div>
                  <div className="text-xs text-green-700 mt-1">units (best case)</div>
                </div>
                <div className="bg-white/50 rounded-lg p-3">
                  <div className="flex items-center gap-1 text-orange-600 font-medium mb-1">
                    <TrendingDown className="w-3.5 h-3.5" />
                    If Sales Decrease
                  </div>
                  <div className="text-2xl font-bold text-orange-900">
                    {forecast.forecastRange.low}
                  </div>
                  <div className="text-xs text-orange-700 mt-1">units (worst case)</div>
                </div>
              </div>
              
              {/* Simple Math */}
              <div className="mt-3 text-xs text-blue-700 bg-white/30 rounded p-2">
                💡 You sell ~{forecast.dailyAverage} per day × 30 days = {forecast.forecastTotal} units expected
              </div>
            </div>
          </div>
        </div>

        {/* Reorder Suggestion - Simplified Language */}
        {forecast.reorderSuggestion?.shouldReorder && (
          <div className={`rounded-lg p-4 ${
            forecast.reorderSuggestion.urgency === "critical"
              ? "bg-red-50 border-2 border-red-300"
              : forecast.reorderSuggestion.urgency === "high"
              ? "bg-orange-50 border-2 border-orange-300"
              : "bg-yellow-50 border-2 border-yellow-300"
          }`}>
            <div className="flex items-start gap-3">
              <Package className={`w-6 h-6 mt-0.5 ${
                forecast.reorderSuggestion.urgency === "critical"
                  ? "text-red-600"
                  : forecast.reorderSuggestion.urgency === "high"
                  ? "text-orange-600"
                  : "text-yellow-600"
              }`} />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className={`font-semibold ${
                    forecast.reorderSuggestion.urgency === "critical"
                      ? "text-red-900"
                      : forecast.reorderSuggestion.urgency === "high"
                      ? "text-orange-900"
                      : "text-yellow-900"
                  }`}>
                    {forecast.reorderSuggestion.urgency === "critical" 
                      ? "⚠️ URGENT: Order Now!" 
                      : forecast.reorderSuggestion.urgency === "high"
                      ? "📦 Time to Order Soon"
                      : "📋 Consider Ordering"}
                  </h4>
                </div>
                
                {/* Clear Action Message */}
                <div className={`text-sm mb-3 font-medium ${
                  forecast.reorderSuggestion.urgency === "critical"
                    ? "text-red-800"
                    : forecast.reorderSuggestion.urgency === "high"
                    ? "text-orange-800"
                    : "text-yellow-800"
                }`}>
                  You have {forecast.reorderSuggestion.daysUntilStockOut !== undefined 
                    ? `only ${forecast.reorderSuggestion.daysUntilStockOut} days of stock left` 
                    : 'low stock'}
                </div>
                
                {/* What to Do Box */}
                <div className="bg-white/70 rounded-lg p-3 mb-3">
                  <div className="font-semibold text-gray-900 text-sm mb-2">✅ What to Do:</div>
                  <div className="text-sm text-gray-700">
                    Order <span className="font-bold text-lg text-blue-600">{forecast.reorderSuggestion.suggestedQuantity}</span> units 
                    {forecast.reorderSuggestion.estimatedCost > 0 && (
                      <> for about <span className="font-bold text-lg text-green-600">₱{forecast.reorderSuggestion.estimatedCost.toLocaleString()}</span></>
                    )}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    This gives you 30 days of stock (covering expected demand)
                  </div>
                </div>
                
                {/* Current Situation */}
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="bg-white/50 rounded p-2">
                    <div className="text-gray-600 mb-1">You Have Now</div>
                    <div className="font-bold text-gray-900 text-base">
                      {forecast.reorderSuggestion.currentStock}
                    </div>
                  </div>
                  <div className="bg-white/50 rounded p-2">
                    <div className="text-gray-600 mb-1">You Should Have</div>
                    <div className="font-bold text-gray-900 text-base">
                      {forecast.reorderSuggestion.reorderLevel || 100}
                    </div>
                  </div>
                  <div className="bg-white/50 rounded p-2">
                    <div className="text-gray-600 mb-1">Order This Much</div>
                    <div className="font-bold text-blue-600 text-base">
                      {forecast.reorderSuggestion.suggestedQuantity}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* If NO reorder needed - show positive message */}
        {!forecast.reorderSuggestion?.shouldReorder && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-900 mb-1">✅ Stock is Good!</h4>
                <p className="text-sm text-green-800">
                  You have enough stock for the next {forecast.daysOfStock} days. No need to order yet!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Additional Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Seasonality - Enhanced with Dynamic Detection */}
          {forecast.isSeasonal && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Sparkles className="w-5 h-5 text-purple-600 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h5 className="text-sm font-semibold text-purple-900">
                      🌸 Seasonal Medicine
                      {forecast.seasonalityMethod === 'dynamic-detected' && (
                        <span className="ml-2 text-xs font-normal bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          AI Detected
                        </span>
                      )}
                      {forecast.seasonalityMethod === 'static-category' && (
                        <span className="ml-2 text-xs font-normal bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          Category Based
                        </span>
                      )}
                    </h5>
                  </div>
                  
                  <p className="text-xs text-purple-700 mt-2">
                    <strong>Peak sales during:</strong><br/>
                    {forecast.peakMonths?.map(m => {
                      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                      return months[m - 1];
                    }).join(", ")}
                  </p>
                  
                  <p className="text-xs text-purple-600 mt-2 bg-white/50 rounded p-2">
                    💡 During peak months, expect <strong>{((forecast.seasonalityFactor - 1) * 100).toFixed(0)}%</strong> {forecast.seasonalityFactor > 1 ? 'more' : 'less'} sales than normal
                  </p>
                  
                  {forecast.seasonalityConfidence && (
                    <div className="mt-2 text-xs text-purple-600">
                      <div className="flex items-center justify-between mb-1">
                        <span>Pattern Confidence:</span>
                        <span className="font-semibold">{(forecast.seasonalityConfidence * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-purple-200 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full bg-purple-600"
                          style={{ width: `${forecast.seasonalityConfidence * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Confidence Score - Simplified */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-gray-600 mt-0.5" />
              <div className="flex-1">
                <h5 className="text-sm font-semibold text-gray-900 mb-2">How Accurate Is This?</h5>
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700">
                      {forecast.confidence >= 70 ? "Very Reliable" :
                       forecast.confidence >= 50 ? "Good Prediction" : "Need More Data"}
                    </span>
                    <span className="text-xs text-gray-500">
                      {forecast.confidence}% confidence ({forecast.dataPoints} sales)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        forecast.confidence >= 70 ? "bg-green-500" :
                        forecast.confidence >= 50 ? "bg-yellow-500" : "bg-orange-500"
                      }`}
                      style={{ width: `${forecast.confidence}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    {forecast.confidence >= 70 
                      ? "✅ This forecast is highly accurate because we have lots of sales history."
                      : forecast.confidence >= 50
                      ? "👍 This forecast is reliable with moderate sales history."
                      : "⚠️ This forecast is less certain. We need more sales data for better accuracy."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Forecast Chart */}
        <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-sm font-semibold text-gray-900">
              7-Day Forecast Preview
            </h5>
            <span className="text-xs text-gray-500">units per day</span>
          </div>
          <div className="flex items-end justify-between gap-3 h-40 bg-white rounded-lg p-3 border border-gray-100">
            {forecast.forecast.slice(0, 7).map((value, index) => {
              const values = forecast.forecast.slice(0, 7);
              const maxValue = Math.max(...values);
              const minValue = Math.min(...values);
              
              // Better scaling: use range from min to max, with minimum bar height
              const range = maxValue - minValue;
              let height;
              
              if (range === 0 || maxValue === 0) {
                // All values are the same or zero
                height = value > 0 ? 50 : 0;
              } else {
                // Scale from 20% to 100% to show variations better
                const normalizedValue = (value - minValue) / range;
                height = 20 + (normalizedValue * 80);
              }
              
              // Color based on value relative to average
              const avgValue = values.reduce((sum, v) => sum + v, 0) / values.length;
              const barColor = value > avgValue * 1.1 
                ? "bg-green-500 hover:bg-green-600" 
                : value < avgValue * 0.9
                ? "bg-orange-400 hover:bg-orange-500"
                : "bg-blue-500 hover:bg-blue-600";
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-1.5 group relative">
                  {/* Tooltip */}
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {value.toFixed(1)} units
                  </div>
                  
                  {/* Value Label */}
                  <div className="text-xs font-semibold text-gray-700 mb-1">
                    {value.toFixed(1)}
                  </div>
                  
                  {/* Bar */}
                  <div className="w-full flex flex-col justify-end items-center" style={{ height: '100px' }}>
                    <div
                      className={`w-full ${barColor} rounded-t transition-all cursor-pointer shadow-sm`}
                      style={{ 
                        height: `${height}%`,
                        minHeight: value > 0 ? "8px" : "0"
                      }}
                    />
                  </div>
                  
                  {/* Day Label */}
                  <div className="text-xs font-medium text-gray-600 mt-1">
                    D{index + 1}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Chart Legend */}
          <div className="flex items-center justify-center gap-4 mt-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-gray-600">Above Average</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-gray-600">Normal</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-orange-400 rounded"></div>
              <span className="text-gray-600">Below Average</span>
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-200">
          Last updated: {new Date(forecast.generatedAt).toLocaleString()}
        </div>
      </div>
    </div>
  );
};

export default DemandForecastingPanel;
