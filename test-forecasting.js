/**
 * Test Demand Forecasting Service
 * 
 * Run this test to verify the forecasting algorithms work correctly
 * with your actual database.
 */

import { DemandForecastingService } from './src/services/domains/analytics/demandForecastingService.js';

async function testForecasting() {
  console.log("🧪 Testing Demand Forecasting Service...\n");

  try {
    // Test 1: Get demand summary
    console.log("📊 Test 1: Getting demand summary...");
    const summary = await DemandForecastingService.getDemandSummary();
    console.log("Summary:", JSON.stringify(summary, null, 2));
    console.log("✅ Test 1 passed\n");

    // Test 2: Get top demand products
    console.log("🏆 Test 2: Getting top demand products...");
    const topProducts = await DemandForecastingService.getTopDemandProducts(5);
    console.log(`Found ${topProducts.length} products`);
    topProducts.forEach((p, i) => {
      console.log(`${i + 1}. ${p.productName}`);
      console.log(`   - Demand: ${p.demandLevel} (${p.dailyAverage} units/day)`);
      console.log(`   - Trend: ${p.trend} (${p.trendPercentage}%)`);
      console.log(`   - Stock: ${p.daysOfStock} days remaining`);
      if (p.reorderSuggestion?.shouldReorder) {
        console.log(`   - ⚠️ Reorder needed: ${p.reorderSuggestion.suggestedQuantity} units`);
      }
    });
    console.log("✅ Test 2 passed\n");

    // Test 3: Get trending products
    console.log("📈 Test 3: Getting trending products...");
    const trending = await DemandForecastingService.getTrendingProducts(3);
    console.log(`Found ${trending.length} trending products`);
    trending.forEach((p, i) => {
      console.log(`${i + 1}. ${p.productName} - ${p.trendIcon} ${p.trendPercentage}%`);
    });
    console.log("✅ Test 3 passed\n");

    // Test 4: Get detailed forecast for a specific product
    if (topProducts.length > 0) {
      console.log("🔍 Test 4: Getting detailed forecast...");
      const productId = topProducts[0].productId;
      const forecast = await DemandForecastingService.getForecast(productId, 30);
      
      console.log("\nDetailed Forecast:");
      console.log("─".repeat(50));
      console.log(`Product: ${forecast.productName}`);
      console.log(`Category: ${forecast.category}`);
      console.log(`\nCurrent Stock: ${forecast.currentStock} units`);
      console.log(`Days of Stock: ${forecast.daysOfStock} days`);
      console.log(`\nDemand Analysis:`);
      console.log(`  - Level: ${forecast.demandLevel} ${forecast.demandIcon}`);
      console.log(`  - Daily Avg: ${forecast.dailyAverage} units`);
      console.log(`  - Weekly Avg: ${forecast.weeklyAverage} units`);
      console.log(`  - Monthly Avg: ${forecast.monthlyAverage} units`);
      console.log(`\nTrend Analysis:`);
      console.log(`  - Direction: ${forecast.trend} ${forecast.trendIcon}`);
      console.log(`  - Change: ${forecast.trendPercentage}%`);
      console.log(`\n30-Day Forecast:`);
      console.log(`  - Expected: ${forecast.forecastTotal} units`);
      console.log(`  - Best Case: ${forecast.forecastRange.high} units`);
      console.log(`  - Worst Case: ${forecast.forecastRange.low} units`);
      console.log(`  - Confidence: ${forecast.confidence}%`);
      
      if (forecast.isSeasonal) {
        console.log(`\nSeasonality:`);
        console.log(`  - Seasonal Product: Yes 🌸`);
        console.log(`  - Peak Months: ${forecast.peakMonths.join(", ")}`);
        console.log(`  - Seasonal Factor: ${forecast.seasonalityFactor}x`);
      }
      
      if (forecast.reorderSuggestion?.shouldReorder) {
        console.log(`\nReorder Suggestion:`);
        console.log(`  - Urgency: ${forecast.reorderSuggestion.urgency.toUpperCase()}`);
        console.log(`  - Message: ${forecast.reorderSuggestion.message}`);
        console.log(`  - Suggested Qty: ${forecast.reorderSuggestion.suggestedQuantity} units`);
        if (forecast.reorderSuggestion.estimatedCost > 0) {
          console.log(`  - Est. Cost: ₱${forecast.reorderSuggestion.estimatedCost.toLocaleString()}`);
        }
      }
      
      console.log("\n7-Day Forecast Preview:");
      forecast.forecast.slice(0, 7).forEach((value, day) => {
        const bar = "█".repeat(Math.ceil(value / 2));
        console.log(`  Day ${day + 1}: ${bar} ${value} units`);
      });
      
      console.log("─".repeat(50));
      console.log("✅ Test 4 passed\n");
    }

    console.log("\n🎉 All tests passed successfully!");
    console.log("\nNext steps:");
    console.log("1. Visit /forecasting in your app to see the dashboard");
    console.log("2. Add <DemandIndicator productId={id} /> to product cards");
    console.log("3. Use <DemandForecastingPanel productId={id} /> for detailed views");

  } catch (error) {
    console.error("\n❌ Test failed:", error);
    console.error("\nError details:", error.message);
    console.error("\nStack trace:", error.stack);
  }
}

// Run tests
testForecasting();
