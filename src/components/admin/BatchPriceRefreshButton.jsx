/**
 * ============================================================================
 * BATCH PRICE REFRESH BUTTON
 * ============================================================================
 * Admin utility to manually refresh all product prices to match oldest batches
 * Useful for troubleshooting or after bulk operations
 */

import React, { useState } from 'react';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { refreshAllProductPrices } from '../../utils/batchPricingUtils';

const BatchPriceRefreshButton = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [result, setResult] = useState(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setResult(null);

    try {
      const response = await refreshAllProductPrices();
      
      if (response.success) {
        setResult({
          type: 'success',
          message: `✅ ${response.message}`,
          count: response.productsUpdated
        });
        
        // Auto-hide success message after 5 seconds
        setTimeout(() => setResult(null), 5000);
      } else {
        setResult({
          type: 'error',
          message: `❌ Failed: ${response.error}`
        });
      }
    } catch (error) {
      setResult({
        type: 'error',
        message: `❌ Error: ${error.message}`
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-medium
          transition-all duration-200
          ${isRefreshing 
            ? 'bg-gray-300 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
          }
        `}
      >
        <RefreshCw 
          className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} 
        />
        <span>
          {isRefreshing ? 'Refreshing Prices...' : 'Refresh All Product Prices'}
        </span>
      </button>

      {result && (
        <div
          className={`
            flex items-start gap-2 p-3 rounded-lg text-sm
            ${result.type === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
            }
          `}
        >
          {result.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <p className={result.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {result.message}
            </p>
            {result.count !== undefined && (
              <p className="text-green-600 text-xs mt-1">
                📊 {result.count} products updated
              </p>
            )}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-600 mt-1">
        💡 Use this if product prices don't match the oldest batch price (FIFO). 
        This syncs all products with their current oldest active batch.
      </p>
    </div>
  );
};

export default BatchPriceRefreshButton;
