import { supabase } from "../../../config/supabase.js";

/**
 * 📊 Demand Forecasting Service
 * 
 * Provides intelligent demand prediction and sales forecasting for inventory management.
 * Uses multiple algorithms to predict future demand based on historical sales data.
 * 
 * Features:
 * - Moving average forecasting
 * - Trend analysis (increasing/stable/declining)
 * - Seasonal pattern detection
 * - Demand classification (high/medium/low purchase power)
 * - Confidence intervals
 * - Smart reorder suggestions
 */
export class DemandForecastingService {
  
  // Demand classification thresholds
  static DEMAND_LEVELS = {
    HIGH: { min: 10, label: "High", color: "green", icon: "↗️" },
    MEDIUM: { min: 3, label: "Medium", color: "yellow", icon: "→" },
    LOW: { min: 0, label: "Low", color: "orange", icon: "↘️" },
    NONE: { min: 0, label: "No Demand", color: "red", icon: "⚠️" },
  };

  // Trend indicators
  static TRENDS = {
    INCREASING: { label: "Increasing", icon: "📈", color: "green", threshold: 0.15 },
    STABLE: { label: "Stable", icon: "➡️", color: "blue", threshold: 0.15 },
    DECLINING: { label: "Declining", icon: "📉", color: "orange", threshold: -0.15 },
  };

  // Seasonality patterns
  static SEASONAL_CATEGORIES = {
    "Pain Relief": { seasonal: false, peakMonths: [] },
    "Antibiotics": { seasonal: true, peakMonths: [12, 1, 2, 6, 7] }, // Cold/flu season
    "Antihistamine": { seasonal: true, peakMonths: [3, 4, 5, 9, 10] }, // Allergy season
    "Respiratory": { seasonal: true, peakMonths: [12, 1, 2, 6, 7] },
    "Vitamins": { seasonal: true, peakMonths: [1, 6, 9, 12] }, // New year, back to school
    "Cardiovascular": { seasonal: false, peakMonths: [] },
    "Diabetes": { seasonal: false, peakMonths: [] },
    "Gastro": { seasonal: false, peakMonths: [] },
  };

  /**
   * Get comprehensive demand forecast for a product
   * @param {string} productId - Product ID
   * @param {number} forecastDays - Number of days to forecast (default: 30)
   * @returns {Object} Complete forecast analysis
   */
  static async getForecast(productId, forecastDays = 30) {
    try {
      // Fetch product with sales history
      const product = await this.getProductWithSalesHistory(productId);
      
      if (!product) {
        throw new Error("Product not found");
      }

      // Get sales history data
      const salesHistory = await this.getSalesHistory(productId, 90); // Last 90 days
      
      // Calculate various metrics
      const dailyAverage = this.calculateDailyAverage(salesHistory, 30);
      const weeklyAverage = this.calculateDailyAverage(salesHistory, 7);
      const trend = this.detectTrend(salesHistory);
      const demandLevel = this.classifyDemand(dailyAverage);
      const seasonality = this.detectSeasonality(product, salesHistory);
      
      // Generate forecast
      const forecast = this.generateForecast(
        salesHistory,
        forecastDays,
        trend,
        seasonality,
        product
      );

      // Calculate confidence
      const confidence = this.calculateConfidence(salesHistory);

      // Generate reorder suggestion
      const reorderSuggestion = this.generateReorderSuggestion(
        product,
        forecast,
        dailyAverage
      );

      return {
        productId,
        productName: product.brand_name || product.generic_name,
        category: product.category,
        currentStock: product.stock_in_pieces || 0,
        
        // Historical metrics
        dailyAverage: Math.round(dailyAverage * 10) / 10,
        weeklyAverage: Math.round(weeklyAverage * 10) / 10,
        monthlyAverage: Math.round(dailyAverage * 30 * 10) / 10,
        
        // Demand classification
        demandLevel: demandLevel.label,
        demandColor: demandLevel.color,
        demandIcon: demandLevel.icon,
        
        // Trend analysis
        trend: trend.label,
        trendIcon: trend.icon,
        trendColor: trend.color,
        trendPercentage: Math.round(trend.percentage * 100),
        
        // Seasonality (enhanced with dynamic detection info)
        isSeasonal: seasonality.isSeasonal,
        seasonalityFactor: seasonality.factor,
        peakMonths: seasonality.peakMonths,
        seasonalityMethod: seasonality.method, // NEW: How seasonality was detected
        seasonalityConfidence: seasonality.confidence, // NEW: Confidence in detection
        seasonalityAnalysis: seasonality.analysis, // NEW: Detailed analysis (if dynamic)
        
        // Forecast data
        forecast: forecast.dailyForecast,
        forecastTotal: forecast.totalForecasted,
        forecastRange: {
          low: forecast.lowEstimate,
          high: forecast.highEstimate,
        },
        
        // Confidence
        confidence: Math.round(confidence * 100),
        dataPoints: salesHistory.length,
        
        // Reorder suggestion
        reorderSuggestion,
        
        // Stock analysis
        daysOfStock: this.calculateDaysOfStock(product.stock_in_pieces, dailyAverage),
        stockStatus: this.getStockStatus(product, dailyAverage),
        
        // Metadata
        generatedAt: new Date().toISOString(),
        dataRange: {
          from: salesHistory.length > 0 
            ? new Date(Math.min(...salesHistory.map(s => new Date(s.created_at)))).toISOString()
            : null,
          to: salesHistory.length > 0
            ? new Date(Math.max(...salesHistory.map(s => new Date(s.created_at)))).toISOString()
            : null,
        },
      };
    } catch (error) {
      console.error("Error generating forecast:", error);
      throw error;
    }
  }

  /**
   * Get forecasts for multiple products
   * @param {Array} productIds - Array of product IDs
   * @returns {Array} Array of forecast objects
   */
  static async getMultipleForecasts(productIds) {
    try {
      const forecasts = await Promise.all(
        productIds.map(id => this.getForecast(id).catch(err => {
          console.error(`Error forecasting product ${id}:`, err);
          return null;
        }))
      );
      
      return forecasts.filter(f => f !== null);
    } catch (error) {
      console.error("Error generating multiple forecasts:", error);
      return [];
    }
  }

  /**
   * Get top products by demand level
   * @param {number} limit - Number of products to return
   * @returns {Array} Sorted array of product forecasts
   */
  static async getTopDemandProducts(limit = 10) {
    try {
      // Get all active products (remove limit to get ALL products)
      const { data: products, error } = await supabase
        .from("products")
        .select("id, brand_name, generic_name, category, stock_in_pieces")
        .eq("status", "active");

      if (error) throw error;

      // Get forecasts for all products
      const forecasts = await this.getMultipleForecasts(
        products.map(p => p.id)
      );

      // Sort by daily average (highest demand first) and apply limit
      return forecasts
        .sort((a, b) => b.dailyAverage - a.dailyAverage)
        .slice(0, limit);
    } catch (error) {
      console.error("Error getting top demand products:", error);
      return [];
    }
  }

  /**
   * Get ALL products with forecasting (no limit)
   * @returns {Array} All product forecasts
   */
  static async getAllProductForecasts() {
    try {
      // Get ALL active products
      const { data: products, error } = await supabase
        .from("products")
        .select("id, brand_name, generic_name, category, stock_in_pieces")
        .eq("status", "active");

      if (error) throw error;

      console.log(`📊 Loading forecasts for ${products.length} products...`);

      // Get forecasts for all products
      const forecasts = await this.getMultipleForecasts(
        products.map(p => p.id)
      );

      console.log(`✅ Successfully loaded ${forecasts.length} forecasts`);

      // Sort by daily average (highest demand first)
      return forecasts.sort((a, b) => b.dailyAverage - a.dailyAverage);
    } catch (error) {
      console.error("Error getting all product forecasts:", error);
      return [];
    }
  }

  /**
   * Get products with increasing demand
   * @param {number} limit - Number of products to return
   * @returns {Array} Products with increasing trends
   */
  static async getTrendingProducts(limit = 10) {
    try {
      const { data: products, error } = await supabase
        .from("products")
        .select("id")
        .eq("status", "active");

      if (error) throw error;

      const forecasts = await this.getMultipleForecasts(
        products.map(p => p.id)
      );

      return forecasts
        .filter(f => f.trend === "Increasing")
        .sort((a, b) => b.trendPercentage - a.trendPercentage)
        .slice(0, limit);
    } catch (error) {
      console.error("Error getting trending products:", error);
      return [];
    }
  }

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * Get product with its details
   */
  static async getProductWithSalesHistory(productId) {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching product:", error);
      return null;
    }
  }

  /**
   * Get sales history for a product
   * @param {string} productId - Product ID
   * @param {number} days - Number of days to look back
   * @returns {Array} Sales transactions
   */
  static async getSalesHistory(productId, days = 90) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from("sale_items")
        .select(`
          quantity,
          unit_price,
          created_at,
          sales!inner(
            created_at,
            status
          )
        `)
        .eq("product_id", productId)
        .eq("sales.status", "completed")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching sales history:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error in getSalesHistory:", error);
      return [];
    }
  }

  /**
   * Calculate daily average sales
   */
  static calculateDailyAverage(salesHistory, days = 30) {
    if (!salesHistory || salesHistory.length === 0) return 0;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentSales = salesHistory.filter(
      sale => new Date(sale.created_at) >= cutoffDate
    );

    if (recentSales.length === 0) return 0;

    const totalQuantity = recentSales.reduce(
      (sum, sale) => sum + (sale.quantity || 0),
      0
    );

    return totalQuantity / days;
  }

  /**
   * Detect sales trend
   */
  static detectTrend(salesHistory) {
    if (!salesHistory || salesHistory.length < 14) {
      return { ...this.TRENDS.STABLE, percentage: 0 };
    }

    // Compare last 7 days to previous 7 days
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const recentSales = salesHistory.filter(
      s => new Date(s.created_at) >= sevenDaysAgo
    );
    
    const previousSales = salesHistory.filter(
      s => new Date(s.created_at) >= fourteenDaysAgo && 
           new Date(s.created_at) < sevenDaysAgo
    );

    const recentTotal = recentSales.reduce((sum, s) => sum + s.quantity, 0);
    const previousTotal = previousSales.reduce((sum, s) => sum + s.quantity, 0);

    if (previousTotal === 0) {
      return recentTotal > 0 
        ? { ...this.TRENDS.INCREASING, percentage: 1.0 }
        : { ...this.TRENDS.STABLE, percentage: 0 };
    }

    const changePercentage = (recentTotal - previousTotal) / previousTotal;

    if (changePercentage >= this.TRENDS.INCREASING.threshold) {
      return { ...this.TRENDS.INCREASING, percentage: changePercentage };
    } else if (changePercentage <= this.TRENDS.DECLINING.threshold) {
      return { ...this.TRENDS.DECLINING, percentage: changePercentage };
    } else {
      return { ...this.TRENDS.STABLE, percentage: changePercentage };
    }
  }

  /**
   * Classify demand level
   */
  static classifyDemand(dailyAverage) {
    if (dailyAverage >= this.DEMAND_LEVELS.HIGH.min) {
      return this.DEMAND_LEVELS.HIGH;
    } else if (dailyAverage >= this.DEMAND_LEVELS.MEDIUM.min) {
      return this.DEMAND_LEVELS.MEDIUM;
    } else if (dailyAverage > 0) {
      return this.DEMAND_LEVELS.LOW;
    } else {
      return this.DEMAND_LEVELS.NONE;
    }
  }

  /**
   * Detect seasonality patterns DYNAMICALLY from actual sales data
   */
  static detectSeasonality(product, salesHistory) {
    const category = product.category || "Other";
    
    // First, try dynamic detection from sales data
    const dynamicSeasonality = this.detectDynamicSeasonality(salesHistory);
    
    // If we have enough data and detected seasonality, use it
    if (dynamicSeasonality.isSeasonal && dynamicSeasonality.confidence >= 0.6) {
      return dynamicSeasonality;
    }
    
    // Fall back to static category-based detection if not enough data
    const seasonalInfo = this.SEASONAL_CATEGORIES[category] || { seasonal: false, peakMonths: [] };

    if (!seasonalInfo.seasonal) {
      return {
        isSeasonal: false,
        factor: 1.0,
        peakMonths: [],
        method: 'static-none',
        confidence: 1.0,
      };
    }

    // Check if current month is a peak month (static method)
    const currentMonth = new Date().getMonth() + 1; // 1-12
    const isPeakMonth = seasonalInfo.peakMonths.includes(currentMonth);

    // Calculate seasonal factor based on peak months
    const factor = isPeakMonth ? 1.3 : 0.9;

    return {
      isSeasonal: true,
      factor,
      peakMonths: seasonalInfo.peakMonths,
      isPeakPeriod: isPeakMonth,
      method: 'static-category',
      confidence: 0.7, // Static detection has moderate confidence
    };
  }

  /**
   * DYNAMIC seasonality detection from actual sales history
   * Analyzes month-by-month patterns to find peaks automatically
   */
  static detectDynamicSeasonality(salesHistory) {
    // Need at least 365 days of data for reliable seasonal detection
    if (!salesHistory || salesHistory.length < 100) {
      return { 
        isSeasonal: false, 
        factor: 1.0, 
        peakMonths: [],
        method: 'insufficient-data',
        confidence: 0.0,
      };
    }

    // Group sales by month
    const salesByMonth = {};
    for (let month = 1; month <= 12; month++) {
      salesByMonth[month] = { total: 0, count: 0 };
    }

    // Aggregate sales data by month
    salesHistory.forEach(sale => {
      const month = new Date(sale.created_at).getMonth() + 1; // 1-12
      salesByMonth[month].total += sale.quantity || 0;
      salesByMonth[month].count += 1;
    });

    // Calculate average sales per month
    const monthlyAverages = {};
    let totalAverage = 0;
    let monthsWithData = 0;

    for (let month = 1; month <= 12; month++) {
      if (salesByMonth[month].count > 0) {
        monthlyAverages[month] = salesByMonth[month].total / salesByMonth[month].count;
        totalAverage += monthlyAverages[month];
        monthsWithData++;
      } else {
        monthlyAverages[month] = 0;
      }
    }

    // Need data from at least 6 months
    if (monthsWithData < 6) {
      return { 
        isSeasonal: false, 
        factor: 1.0, 
        peakMonths: [],
        method: 'insufficient-months',
        confidence: 0.0,
      };
    }

    totalAverage = totalAverage / monthsWithData;

    // Find peak months (>30% above average)
    const peakMonths = [];
    const significantMonths = [];
    
    for (let month = 1; month <= 12; month++) {
      if (monthlyAverages[month] > 0) {
        const deviation = (monthlyAverages[month] - totalAverage) / totalAverage;
        
        if (deviation > 0.30) {
          // Peak month (>30% above average)
          peakMonths.push(month);
          significantMonths.push({ month, deviation, type: 'peak' });
        } else if (deviation < -0.30) {
          // Low month (>30% below average)
          significantMonths.push({ month, deviation, type: 'low' });
        }
      }
    }

    // Calculate variance to determine if pattern is significant
    const variance = this.calculateMonthlyVariance(monthlyAverages, totalAverage);
    const coefficientOfVariation = Math.sqrt(variance) / totalAverage;

    // Determine if seasonal (has significant peaks and variation)
    const isSeasonal = peakMonths.length >= 2 && coefficientOfVariation > 0.25;
    
    if (!isSeasonal) {
      return {
        isSeasonal: false,
        factor: 1.0,
        peakMonths: [],
        method: 'dynamic-no-pattern',
        confidence: 0.8,
      };
    }

    // Calculate confidence based on data quality
    const dataQualityScore = Math.min(monthsWithData / 12, 1.0); // More months = better
    const varianceScore = Math.min(coefficientOfVariation / 0.5, 1.0); // Higher variance = clearer pattern
    const peakScore = Math.min(peakMonths.length / 4, 1.0); // More peaks = stronger pattern
    const confidence = (dataQualityScore * 0.4 + varianceScore * 0.3 + peakScore * 0.3);

    // Determine current month factor
    const currentMonth = new Date().getMonth() + 1;
    const isPeakMonth = peakMonths.includes(currentMonth);
    
    let factor = 1.0;
    if (isPeakMonth) {
      // Calculate how much above average this peak month is
      const currentDeviation = (monthlyAverages[currentMonth] - totalAverage) / totalAverage;
      factor = 1.0 + currentDeviation; // e.g., +40% = 1.4x
      factor = Math.min(Math.max(factor, 1.0), 1.8); // Cap between 1.0x and 1.8x
    } else {
      // Check if it's a low month
      const currentDeviation = (monthlyAverages[currentMonth] - totalAverage) / totalAverage;
      if (currentDeviation < -0.2) {
        factor = 1.0 + currentDeviation; // e.g., -30% = 0.7x
        factor = Math.max(factor, 0.6); // Don't go below 0.6x
      }
    }

    return {
      isSeasonal: true,
      factor: Math.round(factor * 100) / 100, // Round to 2 decimals
      peakMonths,
      isPeakPeriod: isPeakMonth,
      method: 'dynamic-detected',
      confidence: Math.round(confidence * 100) / 100,
      monthlyData: monthlyAverages, // For debugging/display
      analysis: {
        totalAverage: Math.round(totalAverage * 10) / 10,
        peakMonthDetails: significantMonths.filter(m => m.type === 'peak'),
        lowMonthDetails: significantMonths.filter(m => m.type === 'low'),
        coefficientOfVariation: Math.round(coefficientOfVariation * 100) / 100,
      },
    };
  }

  /**
   * Calculate variance in monthly sales
   */
  static calculateMonthlyVariance(monthlyAverages, overallAverage) {
    const values = Object.values(monthlyAverages).filter(v => v > 0);
    
    if (values.length === 0) return 0;
    
    const squaredDiffs = values.map(val => Math.pow(val - overallAverage, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    
    return variance;
  }

  /**
   * Generate forecast using multiple methods
   */
  static generateForecast(salesHistory, forecastDays, trend, seasonality, product) {
    if (!salesHistory || salesHistory.length === 0) {
      return {
        dailyForecast: Array(forecastDays).fill(0),
        totalForecasted: 0,
        lowEstimate: 0,
        highEstimate: 0,
      };
    }

    // Calculate base daily average (last 30 days)
    const baseDailyAverage = this.calculateDailyAverage(salesHistory, 30);

    // Apply trend factor
    let trendFactor = 1.0;
    if (trend.label === "Increasing") {
      trendFactor = 1.0 + Math.min(trend.percentage, 0.5); // Cap at 50% increase
    } else if (trend.label === "Declining") {
      trendFactor = 1.0 + Math.max(trend.percentage, -0.5); // Cap at 50% decrease
    }

    // Apply seasonal factor
    const seasonalFactor = seasonality.factor || 1.0;

    // Calculate adjusted daily forecast
    const adjustedDaily = baseDailyAverage * trendFactor * seasonalFactor;

    // Generate daily forecast array with slight variation
    const dailyForecast = [];
    for (let i = 0; i < forecastDays; i++) {
      // Add small random variation (±10%)
      const variation = 0.9 + Math.random() * 0.2;
      const dailyValue = Math.max(0, adjustedDaily * variation);
      dailyForecast.push(Math.round(dailyValue * 10) / 10);
    }

    const totalForecasted = Math.round(
      dailyForecast.reduce((sum, val) => sum + val, 0)
    );

    // Calculate confidence intervals (±20%)
    const lowEstimate = Math.round(totalForecasted * 0.8);
    const highEstimate = Math.round(totalForecasted * 1.2);

    return {
      dailyForecast,
      totalForecasted,
      lowEstimate,
      highEstimate,
    };
  }

  /**
   * Calculate forecast confidence based on data quality
   */
  static calculateConfidence(salesHistory) {
    if (!salesHistory || salesHistory.length === 0) return 0;

    // More data points = higher confidence
    const dataPointScore = Math.min(salesHistory.length / 90, 1) * 0.4;

    // Recent data = higher confidence
    const recentDataScore = salesHistory.filter(
      s => new Date(s.created_at) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length > 0 ? 0.3 : 0;

    // Consistent sales = higher confidence
    const dailyQuantities = this.groupByDay(salesHistory);
    const variance = this.calculateVariance(Object.values(dailyQuantities));
    const consistencyScore = Math.max(0, 0.3 - (variance / 100));

    return Math.min(dataPointScore + recentDataScore + consistencyScore, 1.0);
  }

  /**
   * Group sales by day
   */
  static groupByDay(salesHistory) {
    const grouped = {};
    
    salesHistory.forEach(sale => {
      const date = new Date(sale.created_at).toDateString();
      grouped[date] = (grouped[date] || 0) + sale.quantity;
    });

    return grouped;
  }

  /**
   * Calculate variance
   */
  static calculateVariance(values) {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    
    return variance;
  }

  /**
   * Generate smart reorder suggestion
   */
  static generateReorderSuggestion(product, forecast, dailyAverage) {
    const currentStock = product.stock_in_pieces || 0;
    const reorderLevel = product.reorder_level || 100;
    const leadTimeDays = 7; // Default supplier lead time

    // Calculate days until reorder needed
    const daysOfStock = dailyAverage > 0 ? currentStock / dailyAverage : 999;
    const shouldReorder = daysOfStock <= leadTimeDays || currentStock <= reorderLevel;

    if (!shouldReorder) {
      return {
        shouldReorder: false,
        urgency: "low",
        message: `Stock sufficient for ${Math.round(daysOfStock)} days`,
        suggestedQuantity: 0,
        estimatedCost: 0,
      };
    }

    // Calculate suggested order quantity (30-day supply)
    const thirtyDaySupply = Math.ceil(dailyAverage * 30);
    const currentDeficit = Math.max(0, reorderLevel - currentStock);
    const suggestedQuantity = thirtyDaySupply + currentDeficit;

    // Determine urgency
    let urgency = "low";
    if (currentStock === 0) urgency = "critical";
    else if (daysOfStock <= 3) urgency = "high";
    else if (daysOfStock <= 7) urgency = "medium";

    // Estimate cost (if available)
    const unitCost = product.cost_price || product.price_per_piece || 0;
    const estimatedCost = suggestedQuantity * unitCost;

    return {
      shouldReorder: true,
      urgency,
      daysUntilStockOut: Math.round(daysOfStock),
      suggestedQuantity,
      currentStock,
      reorderLevel,
      estimatedCost: Math.round(estimatedCost * 100) / 100,
      message: this.getReorderMessage(urgency, daysOfStock, suggestedQuantity),
    };
  }

  /**
   * Get reorder message based on urgency
   */
  static getReorderMessage(urgency, daysOfStock, quantity) {
    switch (urgency) {
      case "critical":
        return `⚠️ OUT OF STOCK! Order ${quantity} units immediately`;
      case "high":
        return `🔴 Only ${Math.round(daysOfStock)} days left! Order ${quantity} units`;
      case "medium":
        return `🟡 ${Math.round(daysOfStock)} days remaining. Suggest ordering ${quantity} units`;
      default:
        return `🟢 Stock adequate. Consider ordering ${quantity} units soon`;
    }
  }

  /**
   * Calculate days of stock remaining
   */
  static calculateDaysOfStock(currentStock, dailyAverage) {
    if (dailyAverage === 0) return 999; // No consumption
    return Math.round(currentStock / dailyAverage);
  }

  /**
   * Get stock status with forecast context
   */
  static getStockStatus(product, dailyAverage) {
    const currentStock = product.stock_in_pieces || 0;
    const daysOfStock = this.calculateDaysOfStock(currentStock, dailyAverage);

    if (currentStock === 0) {
      return { status: "out_of_stock", label: "Out of Stock", color: "red" };
    } else if (daysOfStock <= 3) {
      return { status: "critical", label: "Critical", color: "red" };
    } else if (daysOfStock <= 7) {
      return { status: "low", label: "Low Stock", color: "orange" };
    } else if (daysOfStock <= 14) {
      return { status: "moderate", label: "Moderate", color: "yellow" };
    } else {
      return { status: "good", label: "Good", color: "green" };
    }
  }

  /**
   * Get demand summary for dashboard
   */
  static async getDemandSummary() {
    try {
      // Get ALL active products for accurate summary
      const { data: products, error } = await supabase
        .from("products")
        .select("id")
        .eq("status", "active");

      if (error) throw error;

      const forecasts = await this.getMultipleForecasts(
        products.map(p => p.id)
      );

      const summary = {
        totalProducts: forecasts.length,
        highDemand: forecasts.filter(f => f.demandLevel === "High").length,
        mediumDemand: forecasts.filter(f => f.demandLevel === "Medium").length,
        lowDemand: forecasts.filter(f => f.demandLevel === "Low").length,
        trending: forecasts.filter(f => f.trend === "Increasing").length,
        declining: forecasts.filter(f => f.trend === "Declining").length,
        needsReorder: forecasts.filter(f => f.reorderSuggestion?.shouldReorder).length,
        criticalStock: forecasts.filter(
          f => f.reorderSuggestion?.urgency === "critical"
        ).length,
      };

      return summary;
    } catch (error) {
      console.error("Error getting demand summary:", error);
      return null;
    }
  }
}

export default DemandForecastingService;
