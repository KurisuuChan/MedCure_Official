/**
 * ML Service - Demand Forecasting & Predictive Analytics
 *
 * Integrates with DemandForecastingService to provide machine learning
 * capabilities for inventory management and sales prediction.
 */

import { DemandForecastingService } from "../domains/analytics/demandForecastingService.js";
import { supabase } from "../../config/supabase.js";

export class MLService {
  /**
   * Forecast demand for a product over the next `days` days.
   * Uses DemandForecastingService for intelligent predictions.
   */
  static async forecastDemand(productId, days = 7) {
    try {
      const forecast = await DemandForecastingService.getForecast(productId, days);
      
      return {
        productId,
        days,
        forecast: forecast.forecast || [],
        totalForecasted: forecast.forecastTotal,
        dailyAverage: forecast.dailyAverage,
        trend: forecast.trend,
        confidence: forecast.confidence,
        generatedAt: forecast.generatedAt,
      };
    } catch (error) {
      console.error("Error in forecastDemand:", error);
      // Return empty forecast on error
      return {
        productId,
        days,
        forecast: Array.from({ length: Math.max(0, days) }, () => 0),
        generatedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Alias for forecastDemand (some modules check getDemandForecast)
   */
  static async getDemandForecast(productId, days = 7) {
    return this.forecastDemand(productId, days);
  }

  /**
   * Return historical sales for a product
   */
  static async getProductSalesHistory(productId, days = 30) {
    try {
      return await DemandForecastingService.getSalesHistory(productId, days);
    } catch (error) {
      console.error("Error fetching sales history:", error);
      return [];
    }
  }

  /**
   * Exponential smoothing for time series data
   * Alpha = smoothing factor (0-1), higher = more weight to recent data
   */
  static exponentialSmoothing(values = [], alpha = 0.3) {
    if (!Array.isArray(values) || values.length === 0) {
      return { smoothed: [], error: null };
    }

    const smoothed = [values[0]]; // First value stays the same
    
    for (let i = 1; i < values.length; i++) {
      const smoothedValue = alpha * values[i] + (1 - alpha) * smoothed[i - 1];
      smoothed.push(smoothedValue);
    }

    return { smoothed, error: null };
  }

  /**
   * Linear regression forecast
   * Predicts future values based on historical trend
   */
  static linearRegressionForecast(values = [], days = 7) {
    if (!Array.isArray(values) || values.length < 2) {
      return { forecast: Array.from({ length: days }, () => 0) };
    }

    // Calculate linear regression (y = mx + b)
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Generate forecast
    const forecast = [];
    for (let i = 0; i < days; i++) {
      const forecastValue = Math.max(0, slope * (n + i) + intercept);
      forecast.push(Math.round(forecastValue * 10) / 10);
    }

    return { forecast, slope, intercept };
  }

  /**
   * Moving average calculation
   */
  static movingAverage(values = [], window = 7) {
    if (!Array.isArray(values) || values.length < window) {
      return values;
    }

    const result = [];
    for (let i = window - 1; i < values.length; i++) {
      const windowValues = values.slice(i - window + 1, i + 1);
      const average = windowValues.reduce((a, b) => a + b, 0) / window;
      result.push(average);
    }

    return result;
  }

  /**
   * Return customer transaction data
   */
  static async getCustomerTransactionData() {
    try {
      const { data, error } = await supabase
        .from("sales")
        .select(`
          id,
          total_amount,
          created_at,
          customer_name,
          sale_items(quantity, unit_price)
        `)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching customer transactions:", error);
      return [];
    }
  }

  /**
   * Detect anomalies in sales data
   * Returns products with unusual sales patterns
   */
  static async detectAnomalies() {
    try {
      const { data: products, error } = await supabase
        .from("products")
        .select("id, brand_name, generic_name")
        .eq("status", "active")
        .limit(50);

      if (error) throw error;

      const anomalies = [];

      for (const product of products) {
        const salesHistory = await this.getProductSalesHistory(product.id, 30);
        
        if (salesHistory.length < 7) continue;

        const dailyQuantities = salesHistory.map(s => s.quantity);
        const mean = dailyQuantities.reduce((a, b) => a + b, 0) / dailyQuantities.length;
        const variance = dailyQuantities.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / dailyQuantities.length;
        const stdDev = Math.sqrt(variance);

        // Check for recent spikes (> 2 standard deviations)
        const recentSales = salesHistory.slice(-7);
        const hasSpike = recentSales.some(s => Math.abs(s.quantity - mean) > 2 * stdDev);

        if (hasSpike) {
          anomalies.push({
            productId: product.id,
            productName: product.brand_name || product.generic_name,
            type: "spike",
            message: "Unusual increase in demand detected",
          });
        }
      }

      return anomalies;
    } catch (error) {
      console.error("Error detecting anomalies:", error);
      return [];
    }
  }
}

export default MLService;
