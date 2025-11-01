import React, { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Minus, AlertCircle } from "lucide-react";
import { DemandForecastingService } from "../../services/domains/analytics/demandForecastingService";

/**
 * 🎯 Demand Indicator Badge
 * 
 * Compact component showing demand level and trend for a product.
 * Can be embedded in product cards, inventory lists, etc.
 */
const DemandIndicator = ({ 
  productId, 
  size = "sm", // xs, sm, md, lg
  showDetails = true,
  onClick = null,
  className = ""
}) => {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (productId) {
      loadForecast();
    }
  }, [productId]);

  const loadForecast = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await DemandForecastingService.getForecast(productId, 7);
      setForecast(data);
    } catch (err) {
      console.error("Error loading forecast:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = () => {
    if (!forecast) return null;
    
    const iconSize = size === "xs" ? "w-3 h-3" : size === "sm" ? "w-4 h-4" : "w-5 h-5";
    
    switch (forecast.trend) {
      case "Increasing":
        return <TrendingUp className={iconSize} />;
      case "Declining":
        return <TrendingDown className={iconSize} />;
      default:
        return <Minus className={iconSize} />;
    }
  };

  const getDemandBadgeClass = () => {
    if (!forecast) return "bg-gray-100 text-gray-600 border-gray-200";
    
    switch (forecast.demandLevel) {
      case "High":
        return "bg-green-50 text-green-700 border-green-200";
      case "Medium":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "Low":
        return "bg-orange-50 text-orange-700 border-orange-200";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const getTrendColor = () => {
    if (!forecast) return "text-gray-500";
    
    switch (forecast.trend) {
      case "Increasing":
        return "text-green-600";
      case "Declining":
        return "text-orange-600";
      default:
        return "text-blue-600";
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case "xs":
        return {
          container: "text-xs",
          badge: "px-1.5 py-0.5 text-xs",
          icon: "text-lg",
        };
      case "sm":
        return {
          container: "text-sm",
          badge: "px-2 py-1 text-xs",
          icon: "text-xl",
        };
      case "md":
        return {
          container: "text-sm",
          badge: "px-3 py-1.5 text-sm",
          icon: "text-2xl",
        };
      case "lg":
        return {
          container: "text-base",
          badge: "px-4 py-2 text-base",
          icon: "text-3xl",
        };
      default:
        return {
          container: "text-sm",
          badge: "px-2 py-1 text-xs",
          icon: "text-xl",
        };
    }
  };

  if (loading) {
    return (
      <div className={`inline-flex items-center gap-1 ${className}`}>
        <div className="animate-pulse">
          <div className="h-5 w-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !forecast) {
    return null; // Silently fail for non-critical component
  }

  const sizeClasses = getSizeClasses();
  const isClickable = onClick !== null;

  // Extra small - just icon
  if (size === "xs") {
    return (
      <div
        className={`inline-flex items-center gap-1 ${className} ${
          isClickable ? "cursor-pointer hover:opacity-80" : ""
        }`}
        onClick={onClick}
        title={`${forecast.demandLevel} demand (${forecast.dailyAverage} units/day), ${forecast.trend} trend`}
      >
        <span className={sizeClasses.icon}>{forecast.demandIcon}</span>
        <span className={`${getTrendColor()} ${sizeClasses.container}`}>
          {getTrendIcon()}
        </span>
      </div>
    );
  }

  // Small - badge only
  if (size === "sm" && !showDetails) {
    return (
      <div
        className={`inline-flex items-center gap-1 ${className} ${
          isClickable ? "cursor-pointer" : ""
        }`}
        onClick={onClick}
      >
        <div className={`inline-flex items-center gap-1 border rounded-full ${sizeClasses.badge} ${getDemandBadgeClass()}`}>
          <span>{forecast.demandIcon}</span>
          <span className="font-medium">{forecast.demandLevel}</span>
        </div>
      </div>
    );
  }

  // Default - with details
  return (
    <div
      className={`inline-flex items-center gap-2 ${className} ${
        isClickable ? "cursor-pointer hover:opacity-90 transition-opacity" : ""
      }`}
      onClick={onClick}
    >
      {/* Demand Badge */}
      <div className={`inline-flex items-center gap-1.5 border rounded-lg ${sizeClasses.badge} ${getDemandBadgeClass()}`}>
        <span className={sizeClasses.icon}>{forecast.demandIcon}</span>
        <div className="flex flex-col items-start">
          <span className="font-semibold leading-tight">{forecast.demandLevel}</span>
          {showDetails && (
            <span className="text-xs opacity-75 leading-tight">
              {forecast.dailyAverage}/day
            </span>
          )}
        </div>
      </div>

      {/* Trend Indicator */}
      {showDetails && (
        <div className={`inline-flex items-center gap-1 font-medium ${getTrendColor()} ${sizeClasses.container}`}>
          {getTrendIcon()}
          <span>
            {forecast.trendPercentage > 0 ? "+" : ""}
            {forecast.trendPercentage}%
          </span>
        </div>
      )}

      {/* Stock Warning */}
      {showDetails && forecast.daysOfStock <= 7 && (
        <div className={`inline-flex items-center gap-1 ${sizeClasses.container} ${
          forecast.daysOfStock <= 3 ? "text-red-600" : "text-orange-600"
        }`}>
          <AlertCircle className="w-4 h-4" />
          <span className="font-medium">{forecast.daysOfStock}d</span>
        </div>
      )}
    </div>
  );
};

export default DemandIndicator;
