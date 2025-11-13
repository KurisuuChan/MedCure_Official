import React, { useState, useEffect } from 'react';
import {
  X,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  ShoppingCart,
  Calendar,
  BarChart3,
  Percent,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  History,
  Printer,
} from 'lucide-react';
import { supabase } from '../../config/supabase';
import { formatCurrency } from '../../utils/formatting';

export default function ProductStatisticsModal({ product, onClose, onViewPriceHistory }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('all'); // 7, 30, 90, 365, 'all'

  const fetchProductStatistics = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Calculate date range
      let dateFilter = '';
      if (timeRange !== 'all') {
        const days = parseInt(timeRange);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        dateFilter = startDate.toISOString();
      }

      // Fetch sales data
      let salesQuery = supabase
        .from('sale_items')
        .select(`
          id,
          quantity,
          unit_price,
          sales:sale_id (
            id,
            total_amount,
            created_at,
            total_cogs,
            gross_profit
          )
        `)
        .eq('product_id', product.id)
        .order('sales(created_at)', { ascending: false });

      if (dateFilter) {
        salesQuery = salesQuery.gte('sales.created_at', dateFilter);
      }

      const { data: salesData, error: salesError } = await salesQuery;

      if (salesError) throw salesError;

      // Calculate statistics
      const totalUnitsSold = salesData.reduce((sum, item) => sum + item.quantity, 0);
      const totalRevenue = salesData.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
      
      // Calculate cost (using current cost_price as baseline)
      const costPrice = product.cost_price || 0;
      const totalCost = totalUnitsSold * costPrice;
      const totalProfit = totalRevenue - totalCost;
      const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

      // Group by date for trend analysis
      const salesByDate = {};
      salesData.forEach(item => {
        const date = new Date(item.sales.created_at).toLocaleDateString();
        if (!salesByDate[date]) {
          salesByDate[date] = { quantity: 0, revenue: 0, transactions: 0 };
        }
        salesByDate[date].quantity += item.quantity;
        salesByDate[date].revenue += item.quantity * item.unit_price;
        salesByDate[date].transactions += 1;
      });

      // Calculate average order value
      const uniqueTransactions = new Set(salesData.map(item => item.sales.id)).size;
      const avgOrderValue = uniqueTransactions > 0 ? totalRevenue / uniqueTransactions : 0;
      const avgUnitsPerOrder = uniqueTransactions > 0 ? totalUnitsSold / uniqueTransactions : 0;

      // Calculate sales velocity (units per day)
      const daysInRange = timeRange === 'all' ? 
        Math.max(1, Math.ceil((Date.now() - new Date(salesData[salesData.length - 1]?.sales.created_at).getTime()) / (1000 * 60 * 60 * 24))) :
        parseInt(timeRange);
      const salesVelocity = totalUnitsSold / daysInRange;

      // Get last sale date
      const lastSaleDate = salesData.length > 0 ? new Date(salesData[0].sales.created_at) : null;
      const daysSinceLastSale = lastSaleDate ? 
        Math.floor((Date.now() - lastSaleDate.getTime()) / (1000 * 60 * 60 * 24)) : null;

      // Calculate inventory turnover
      const currentStock = product.stock_in_pieces || 0;
      const turnoverRate = currentStock > 0 ? totalUnitsSold / currentStock : 0;

      // Estimate days until out of stock
      const daysUntilOutOfStock = salesVelocity > 0 && currentStock > 0 ? 
        Math.floor(currentStock / salesVelocity) : null;

      setStats({
        totalUnitsSold,
        totalRevenue,
        totalCost,
        totalProfit,
        profitMargin,
        salesByDate,
        uniqueTransactions,
        avgOrderValue,
        avgUnitsPerOrder,
        salesVelocity,
        lastSaleDate,
        daysSinceLastSale,
        turnoverRate,
        daysUntilOutOfStock,
        currentStock,
        reorderLevel: product.reorder_level || 0,
        unitPrice: product.price_per_piece || 0,
        costPrice,
      });

    } catch (error) {
      console.error('Error fetching product statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (product) {
      fetchProductStatistics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, timeRange]);

  const getTimeRangeLabel = () => {
    switch(timeRange) {
      case '7': return 'Last 7 Days';
      case '30': return 'Last 30 Days';
      case '90': return 'Last 90 Days';
      case '365': return 'Last Year';
      case 'all': return 'All Time';
      default: return 'Last 30 Days';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-content, .print-content * {
            visibility: visible;
          }
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
          .print-header {
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #000;
          }
          .print-title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .print-subtitle {
            font-size: 14px;
            color: #666;
          }
          .print-date {
            text-align: right;
            font-size: 12px;
            color: #666;
            margin-top: 10px;
          }
          .print-section {
            page-break-inside: avoid;
            margin-bottom: 20px;
          }
        }
      `}</style>
      
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 print-content">
        <div className="relative w-full max-w-6xl bg-white rounded-xl shadow-2xl max-h-[95vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 print-header">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center no-print">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 print-title">Product Statistics & Analytics</h3>
                <p className="text-sm text-gray-600 print-subtitle">{product.generic_name} - {getTimeRangeLabel()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 no-print">
              <button
                onClick={handlePrint}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900"
                title="Print"
              >
                <Printer className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="print-date hidden print:block">
              Printed on: {new Date().toLocaleString()}
            </div>
          </div>

        {/* Time Range Selector */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 no-print">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Time Period:</span>
            <div className="flex space-x-2">
              {['7', '30', '90', '365', 'all'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 text-sm rounded-lg transition-all ${
                    timeRange === range
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {range === 'all' ? 'All Time' : `${range}D`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-180px)] print:p-0 print:max-h-none">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : stats ? (
            <div className="space-y-6">
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Total Revenue */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <DollarSign className="w-8 h-8 text-green-600" />
                    {stats.totalProfit >= 0 ? (
                      <ArrowUpRight className="w-5 h-5 text-green-600" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats.totalRevenue)}
                  </p>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                </div>

                {/* Total Profit */}
                <div className={`bg-gradient-to-br p-4 rounded-xl border ${
                  stats.totalProfit >= 0 
                    ? 'from-blue-50 to-indigo-50 border-blue-200' 
                    : 'from-red-50 to-pink-50 border-red-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp className={`w-8 h-8 ${stats.totalProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
                    <span className={`text-sm font-semibold ${stats.totalProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {stats.profitMargin.toFixed(1)}%
                    </span>
                  </div>
                  <p className={`text-2xl font-bold ${stats.totalProfit >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                    {formatCurrency(stats.totalProfit)}
                  </p>
                  <p className="text-sm text-gray-600">Total Profit</p>
                </div>

                {/* Units Sold */}
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-4 rounded-xl border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <ShoppingCart className="w-8 h-8 text-purple-600" />
                    <span className="text-sm font-semibold text-purple-600">
                      {stats.uniqueTransactions} orders
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalUnitsSold}
                  </p>
                  <p className="text-sm text-gray-600">Units Sold</p>
                </div>

                {/* Current Stock */}
                <div className={`bg-gradient-to-br p-4 rounded-xl border ${
                  stats.currentStock <= stats.reorderLevel
                    ? 'from-orange-50 to-amber-50 border-orange-200'
                    : 'from-gray-50 to-slate-50 border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <Package className={`w-8 h-8 ${
                      stats.currentStock <= stats.reorderLevel ? 'text-orange-600' : 'text-gray-600'
                    }`} />
                    {stats.currentStock <= stats.reorderLevel && (
                      <AlertCircle className="w-5 h-5 text-orange-600" />
                    )}
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.currentStock}
                  </p>
                  <p className="text-sm text-gray-600">In Stock</p>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Percent className="w-5 h-5 mr-2 text-blue-600" />
                  Performance Metrics ({getTimeRangeLabel()})
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Avg. Order Value</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.avgOrderValue)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Avg. Units/Order</p>
                    <p className="text-xl font-bold text-gray-900">{stats.avgUnitsPerOrder.toFixed(1)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Sales Velocity</p>
                    <p className="text-xl font-bold text-gray-900">{stats.salesVelocity.toFixed(1)} units/day</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Inventory Turnover</p>
                    <p className="text-xl font-bold text-gray-900">{stats.turnoverRate.toFixed(2)}x</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Days Since Last Sale</p>
                    <p className="text-xl font-bold text-gray-900">
                      {stats.daysSinceLastSale !== null ? `${stats.daysSinceLastSale} days` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Est. Days Until Out</p>
                    <p className={`text-xl font-bold ${
                      stats.daysUntilOutOfStock && stats.daysUntilOutOfStock < 30 ? 'text-orange-600' : 'text-gray-900'
                    }`}>
                      {stats.daysUntilOutOfStock !== null ? `${stats.daysUntilOutOfStock} days` : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Pricing & Cost Breakdown */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                    <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                    Pricing & Cost Analysis
                  </h4>
                  {onViewPriceHistory && (
                    <button
                      onClick={() => {
                        onViewPriceHistory(product);
                        onClose();
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                      title="View Price Change History"
                    >
                      <History className="w-4 h-4" />
                      Price History
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Unit Price</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(stats.unitPrice)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Cost Price</p>
                    <p className="text-xl font-bold text-red-600">{formatCurrency(stats.costPrice)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Profit Per Unit</p>
                    <p className="text-xl font-bold text-blue-600">
                      {formatCurrency(stats.unitPrice - stats.costPrice)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Markup %</p>
                    <p className="text-xl font-bold text-purple-600">
                      {product.markup_percentage?.toFixed(1) || '0'}%
                    </p>
                  </div>
                </div>

                {/* Cost Summary Bar */}
                <div className="mt-6 space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Total Cost</span>
                    <span className="font-semibold">{formatCurrency(stats.totalCost)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Total Revenue</span>
                    <span className="font-semibold">{formatCurrency(stats.totalRevenue)}</span>
                  </div>
                  <div className={`flex justify-between text-sm font-bold ${
                    stats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <span>Net Profit</span>
                    <span>{formatCurrency(stats.totalProfit)}</span>
                  </div>
                </div>
              </div>

              {/* Stock Status */}
              {stats.currentStock <= stats.reorderLevel && (
                <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 mr-3" />
                    <div>
                      <h5 className="font-semibold text-orange-900">Low Stock Warning</h5>
                      <p className="text-sm text-orange-700 mt-1">
                        Current stock ({stats.currentStock}) is at or below reorder level ({stats.reorderLevel}). 
                        {stats.daysUntilOutOfStock && ` Estimated ${stats.daysUntilOutOfStock} days until out of stock at current sales velocity.`}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No sales data available for this product</p>
            </div>
          )}
        </div>
      </div>
      </div>
    </>
  );
}
