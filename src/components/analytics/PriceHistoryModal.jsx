import React, { useState, useEffect } from 'react';
import { X, Clock, TrendingUp, TrendingDown, Coins, Calendar, User } from 'lucide-react';
import { supabase } from '../../config/supabase';
import { formatCurrency } from '../../utils/formatting';

export default function PriceHistoryModal({ product, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (product) {
      fetchPriceHistory();
    }
  }, [product]);

  const fetchPriceHistory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('price_history')
        .select(`
          id,
          old_price,
          new_price,
          old_cost_price,
          new_cost_price,
          old_markup_percentage,
          new_markup_percentage,
          reason,
          created_at,
          changed_by
        `)
        .eq('product_id', product.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching price history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriceChange = (oldPrice, newPrice) => {
    if (!oldPrice) return { type: 'initial', text: 'Initial Price', color: 'text-blue-600' };
    
    const change = newPrice - oldPrice;
    const percentChange = ((change / oldPrice) * 100).toFixed(2);
    
    if (change > 0) {
      return {
        type: 'increase',
        text: `+${formatCurrency(change)} (+${percentChange}%)`,
        color: 'text-green-600',
        icon: TrendingUp
      };
    } else if (change < 0) {
      return {
        type: 'decrease',
        text: `${formatCurrency(change)} (${percentChange}%)`,
        color: 'text-red-600',
        icon: TrendingDown
      };
    }
    return { type: 'no-change', text: 'No change', color: 'text-gray-600' };
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Price Change History</h3>
              <p className="text-sm text-gray-600">{product.generic_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No price changes recorded yet</p>
              <p className="text-gray-400 text-sm mt-2">Price changes will appear here when prices are updated</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Current Price Card */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Current Prices</p>
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="text-xs text-gray-500">Unit Price</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {formatCurrency(product.price_per_piece)}
                        </p>
                      </div>
                      <div className="h-8 w-px bg-gray-300"></div>
                      <div>
                        <p className="text-xs text-gray-500">Cost Price</p>
                        <p className="text-xl font-bold text-gray-700">
                          {formatCurrency(product.cost_price || 0)}
                        </p>
                      </div>
                      <div className="h-8 w-px bg-gray-300"></div>
                      <div>
                        <p className="text-xs text-gray-500">Markup</p>
                        <p className="text-xl font-bold text-purple-600">
                          {(product.markup_percentage || 0).toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </div>
                  <Coins className="w-12 h-12 text-blue-400" />
                </div>
              </div>

              {/* History Timeline */}
              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                
                {history.map((record, index) => {
                  const priceChange = getPriceChange(record.old_price, record.new_price);
                  const costChange = getPriceChange(record.old_cost_price, record.new_cost_price);
                  const ChangeIcon = priceChange.icon;

                  return (
                    <div key={record.id} className="relative pl-16 pb-8 last:pb-0">
                      {/* Timeline Dot */}
                      <div className="absolute left-4 w-5 h-5 bg-white border-4 border-purple-500 rounded-full"></div>

                      {/* Card */}
                      <div className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors">
                        {/* Date & User */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span className="font-medium">{formatDate(record.created_at)}</span>
                          </div>
                          {index === 0 && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                              Latest
                            </span>
                          )}
                        </div>

                        {/* Price Changes Grid */}
                        <div className="grid grid-cols-3 gap-4 mb-3">
                          {/* Unit Price Change */}
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-2 font-medium">Unit Price</p>
                            <div className="space-y-1">
                              {record.old_price && (
                                <p className="text-sm text-gray-400 line-through">
                                  {formatCurrency(record.old_price)}
                                </p>
                              )}
                              <p className="text-lg font-bold text-gray-900">
                                {formatCurrency(record.new_price)}
                              </p>
                              {ChangeIcon && (
                                <div className={`flex items-center space-x-1 ${priceChange.color} text-xs font-semibold`}>
                                  <ChangeIcon className="w-3 h-3" />
                                  <span>{priceChange.text}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Cost Price Change */}
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-2 font-medium">Cost Price</p>
                            <div className="space-y-1">
                              {record.old_cost_price && (
                                <p className="text-sm text-gray-400 line-through">
                                  {formatCurrency(record.old_cost_price)}
                                </p>
                              )}
                              <p className="text-lg font-bold text-gray-900">
                                {formatCurrency(record.new_cost_price || 0)}
                              </p>
                              {costChange.icon && (
                                <div className={`flex items-center space-x-1 ${costChange.color} text-xs font-semibold`}>
                                  <costChange.icon className="w-3 h-3" />
                                  <span>{costChange.text}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Markup Change */}
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-2 font-medium">Markup %</p>
                            <div className="space-y-1">
                              {record.old_markup_percentage !== null && (
                                <p className="text-sm text-gray-400 line-through">
                                  {record.old_markup_percentage?.toFixed(2)}%
                                </p>
                              )}
                              <p className="text-lg font-bold text-purple-600">
                                {(record.new_markup_percentage || 0).toFixed(2)}%
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Reason */}
                        {record.reason && (
                          <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                            <p className="text-xs text-blue-600 font-medium mb-1">Reason for change:</p>
                            <p className="text-sm text-gray-700">{record.reason}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary */}
              {history.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">{history.length}</span> price change
                    {history.length !== 1 ? 's' : ''} recorded
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
