# 📊 Demand Forecasting System

## Overview

The Demand Forecasting System is an AI-powered feature that predicts future demand for medicines based on historical sales data. It helps pharmacy managers make informed decisions about inventory reordering, stock levels, and purchasing patterns.

---

## ✨ Features

### 1. **Demand Classification**
Products are automatically classified by purchase power:
- 🟢 **High Demand**: 10+ units/day (fast-moving items)
- 🟡 **Medium Demand**: 3-10 units/day (steady movers)
- 🟠 **Low Demand**: <3 units/day (slow movers)
- ⚠️ **No Demand**: 0 units/day (inactive items)

### 2. **Trend Analysis**
Tracks sales patterns over time:
- 📈 **Increasing**: Growing demand (+15% or more)
- ➡️ **Stable**: Consistent demand (±15%)
- 📉 **Declining**: Decreasing demand (-15% or more)

### 3. **Seasonal Detection**
Automatically detects seasonal products:
- **Antibiotics & Respiratory**: Peak during cold/flu season (Dec-Feb, Jun-Jul)
- **Antihistamines**: Peak during allergy season (Mar-May, Sep-Oct)
- **Vitamins**: Peak during New Year, back-to-school periods
- **Chronic Disease Meds**: Non-seasonal (consistent year-round)

### 4. **Smart Reorder Suggestions**
Intelligent recommendations based on:
- Current stock levels
- Daily consumption rate
- Lead time (supplier delivery time)
- Forecast demand
- Urgency levels: Critical, High, Medium, Low

### 5. **30-Day Forecasts**
Predicts future demand with:
- Daily forecast breakdown
- Total expected sales
- Confidence intervals (best/worst case)
- Confidence score (based on data quality)

---

## 📁 File Structure

```
src/
├── services/
│   └── domains/
│       └── analytics/
│           └── demandForecastingService.js    # Core forecasting logic
│   └── infrastructure/
│       └── mlService.js                       # ML algorithms
├── components/
│   └── analytics/
│       ├── DemandForecastingPanel.jsx         # Detailed forecast view
│       └── DemandIndicator.jsx                # Compact demand badge
└── pages/
    └── ForecastingDashboardPage.jsx           # Full dashboard
```

---

## 🚀 Usage

### Option 1: View Dashboard
Access the complete forecasting dashboard:
```
Navigate to: /forecasting
```

Features:
- View all products with forecasts
- Filter by demand level, trend, category
- Sort by various metrics
- Search products
- Click any product for detailed forecast

### Option 2: Embed in Product Cards
Add demand indicators to existing inventory views:

```jsx
import DemandIndicator from '../components/analytics/DemandIndicator';

// Compact badge (recommended for lists)
<DemandIndicator 
  productId={product.id} 
  size="sm" 
  showDetails={true}
/>

// Extra small (just icons)
<DemandIndicator 
  productId={product.id} 
  size="xs"
/>
```

### Option 3: Detailed Forecast Panel
Show full forecast details:

```jsx
import DemandForecastingPanel from '../components/analytics/DemandForecastingPanel';

// Full detail view
<DemandForecastingPanel productId={product.id} />

// Compact view
<DemandForecastingPanel productId={product.id} compact={true} />
```

### Option 4: Programmatic Access
Use the service directly in your code:

```javascript
import { DemandForecastingService } from './services/domains/analytics/demandForecastingService';

// Get forecast for a product
const forecast = await DemandForecastingService.getForecast(productId, 30);

// Get top demand products
const topProducts = await DemandForecastingService.getTopDemandProducts(10);

// Get trending products
const trending = await DemandForecastingService.getTrendingProducts(10);

// Get demand summary
const summary = await DemandForecastingService.getDemandSummary();
```

---

## 🧮 Algorithms Explained

### Moving Average
Calculates average sales over rolling time periods:
- **7-day average**: Short-term trends
- **30-day average**: Standard baseline
- **90-day average**: Long-term patterns

### Trend Detection
Compares recent performance (last 7 days) vs previous period (7-14 days ago):
```
Trend % = (Recent Sales - Previous Sales) / Previous Sales × 100
```

### Seasonal Adjustment
Applies multipliers during peak seasons:
- **Peak Season**: 1.3x multiplier (30% increase)
- **Off Season**: 0.9x multiplier (10% decrease)

### Confidence Score
Calculated based on:
- **Data Points** (40%): More history = higher confidence
- **Recency** (30%): Recent data = higher confidence
- **Consistency** (30%): Low variance = higher confidence

### Reorder Point Calculation
```
Reorder Point = (Daily Usage × Lead Time) + Safety Stock
Safety Stock = Z-Score × √(Demand Variability) × Daily Usage
```

---

## 📊 Data Requirements

### Minimum Requirements
- At least **7 days** of sales history for basic forecasts
- At least **30 days** of sales history for accurate trends
- At least **90 days** of sales history for seasonal detection

### Data Sources
The system automatically pulls from:
- `sale_items` table (quantity sold per transaction)
- `sales` table (transaction dates and status)
- `products` table (current stock, reorder levels)

### Database Query Example
```sql
SELECT 
  quantity,
  created_at
FROM sale_items
WHERE product_id = 'xxx'
  AND created_at >= NOW() - INTERVAL '90 days'
ORDER BY created_at ASC;
```

---

## 🎨 UI Components

### Dashboard Summary Cards
Shows at-a-glance metrics:
- High Demand Products count
- Trending Products count
- Products Needing Reorder
- Critical Stock Items

### Product Forecast Cards
Each card displays:
- Product name and category
- Demand level badge with icon
- Trend indicator with percentage
- Days of stock remaining
- Reorder alert (if applicable)
- Seasonality badge (if applicable)

### Detailed Forecast Panel
Comprehensive view showing:
- Key metrics (demand, trend, stock)
- 30-day forecast summary
- Reorder recommendations
- Seasonality information
- Confidence score
- 7-day forecast chart
- Last update timestamp

---

## 🔧 Configuration

### Demand Level Thresholds
Adjust in `demandForecastingService.js`:
```javascript
static DEMAND_LEVELS = {
  HIGH: { min: 10, label: "High", color: "green", icon: "↗️" },
  MEDIUM: { min: 3, label: "Medium", color: "yellow", icon: "→" },
  LOW: { min: 0, label: "Low", color: "orange", icon: "↘️" },
};
```

### Trend Thresholds
```javascript
static TRENDS = {
  INCREASING: { threshold: 0.15 },  // 15% increase
  STABLE: { threshold: 0.15 },       // ±15%
  DECLINING: { threshold: -0.15 },   // 15% decrease
};
```

### Seasonal Categories
Add custom seasonality in `SEASONAL_CATEGORIES`:
```javascript
"Your Category": { 
  seasonal: true, 
  peakMonths: [1, 2, 12]  // Jan, Feb, Dec
}
```

---

## 🧪 Testing

### Run Test Script
```bash
node test-forecasting.js
```

Tests include:
1. Demand summary retrieval
2. Top demand products
3. Trending products detection
4. Detailed forecast generation

### Expected Output
```
📊 Test 1: Getting demand summary...
Summary: { totalProducts: 50, highDemand: 12, ... }
✅ Test 1 passed

🏆 Test 2: Getting top demand products...
Found 5 products
1. Biogesic 500mg
   - Demand: High (15.3 units/day)
   - Trend: Increasing (23%)
   ...
```

---

## 🎯 Use Cases

### 1. Inventory Planning
- View which products need urgent reordering
- Plan 30-day purchasing requirements
- Identify slow-moving stock for promotions

### 2. Trend Monitoring
- Spot emerging demand for new products
- Detect declining interest in existing products
- Adjust stock levels based on trends

### 3. Seasonal Preparation
- Prepare for flu season by stocking antibiotics
- Stock allergy meds before peak season
- Reduce inventory of seasonal items off-season

### 4. Cost Optimization
- Avoid overstocking slow-moving items
- Prevent stockouts of high-demand products
- Optimize cash flow with just-in-time ordering

---

## 🚨 Troubleshooting

### Issue: No forecasts showing
**Solution**: Ensure products have sales history
```javascript
// Check if product has sales data
const salesHistory = await DemandForecastingService.getSalesHistory(productId, 30);
console.log("Sales records:", salesHistory.length);
```

### Issue: Low confidence scores
**Solution**: Products need more sales history (aim for 30+ days)

### Issue: Inaccurate forecasts
**Causes**:
- Irregular sales patterns
- New product (insufficient history)
- External factors (promotions, supply issues)

**Solutions**:
- Wait for more data accumulation
- Manually adjust reorder levels
- Consider external factors in planning

---

## 📈 Future Enhancements

### Planned Features
- [ ] Machine learning model training
- [ ] External factor integration (holidays, weather)
- [ ] Competitor price tracking
- [ ] Automatic purchase order generation
- [ ] Email alerts for critical forecasts
- [ ] Export forecast reports (PDF/Excel)
- [ ] Multi-branch forecasting
- [ ] Demand correlation analysis

---

## 💡 Best Practices

1. **Review forecasts weekly**: Adjust based on real-world factors
2. **Update reorder levels**: Keep thresholds aligned with forecasts
3. **Monitor confidence scores**: Low confidence = manual verification needed
4. **Use seasonality data**: Plan ahead for peak seasons
5. **Combine with experience**: AI assists, but human judgment is key
6. **Track accuracy**: Compare forecasts to actual sales
7. **Train staff**: Ensure team understands the metrics

---

## 📞 Support

For issues or questions:
1. Check console for error messages
2. Review database sales data completeness
3. Verify product IDs are correct
4. Test with `test-forecasting.js` script
5. Contact development team with logs

---

## 🎓 Learn More

### Related Documentation
- `BUSINESS_SETTINGS_PERSISTENCE_FIX.md` - Settings management
- `STOCK_ALERTS_ENHANCEMENT.md` - Inventory alerts
- `ENHANCED_ANALYTICS_REPORTS.md` - Analytics features

### External Resources
- Time series forecasting concepts
- Inventory management best practices
- Pharmacy supply chain optimization

---

**Version**: 1.0.0  
**Last Updated**: November 1, 2025  
**Author**: MedCure Development Team
