/**
 * ============================================================================
 * FIFO BATCH PRICING UTILITIES
 * ============================================================================
 * Helper functions for managing batch-based pricing with FIFO logic
 */

import { supabase } from '../config/supabaseClient';

/**
 * Manually refresh a single product's price to match oldest batch
 * Useful when price seems out of sync
 * 
 * @param {string} productId - UUID of the product
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const refreshProductPrice = async (productId) => {
  try {
    const { data, error } = await supabase.rpc('update_product_price_from_fifo', {
      p_product_id: productId
    });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('❌ Failed to refresh product price:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Refresh ALL product prices to match their oldest batches
 * Useful after bulk operations or if prices are out of sync
 * 
 * @returns {Promise<{success: boolean, productsUpdated?: number, error?: string}>}
 */
export const refreshAllProductPrices = async () => {
  try {
    const { data, error } = await supabase.rpc('refresh_all_product_prices');

    if (error) throw error;

    console.log('✅ Refreshed all product prices:', data);
    return {
      success: data.success,
      productsUpdated: data.products_updated,
      message: data.message
    };
  } catch (error) {
    console.error('❌ Failed to refresh all product prices:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get the current batch price for a product (oldest active batch)
 * 
 * @param {string} productId - UUID of the product
 * @returns {Promise<{purchasePrice: number, sellingPrice: number, batchNumber: string, expiryDate: string} | null>}
 */
export const getCurrentBatchPrice = async (productId) => {
  try {
    const { data, error } = await supabase.rpc('get_current_batch_price', {
      p_product_id: productId
    });

    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('❌ Failed to get current batch price:', error);
    return null;
  }
};

/**
 * Get all active batches for a product (sorted by FIFO - oldest first)
 * 
 * @param {string} productId - UUID of the product
 * @returns {Promise<Array>}
 */
export const getProductBatches = async (productId) => {
  try {
    const { data, error } = await supabase
      .from('product_batches')
      .select(`
        id,
        batch_number,
        quantity,
        original_quantity,
        expiry_date,
        purchase_price,
        selling_price,
        markup_percentage,
        supplier_name,
        status,
        created_at
      `)
      .eq('product_id', productId)
      .eq('status', 'active')
      .gt('quantity', 0)
      .order('created_at', { ascending: true })
      .order('expiry_date', { ascending: true });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('❌ Failed to fetch product batches:', error);
    return [];
  }
};

/**
 * Calculate markup percentage
 * 
 * @param {number} purchasePrice - Cost from supplier
 * @param {number} sellingPrice - Price to customer
 * @returns {number} - Markup percentage (can be negative)
 */
export const calculateMarkup = (purchasePrice, sellingPrice) => {
  if (!purchasePrice || purchasePrice === 0) return 0;
  return ((sellingPrice - purchasePrice) / purchasePrice) * 100;
};

/**
 * Format batch number for display
 * Ensures consistent format: BT101325-001
 * 
 * @param {string} batchNumber - Raw batch number
 * @returns {string} - Formatted batch number
 */
export const formatBatchNumber = (batchNumber) => {
  if (!batchNumber) return 'N/A';
  return batchNumber.toUpperCase();
};

/**
 * Get batch status color for UI
 * 
 * @param {string} status - Batch status (active, depleted, expired)
 * @returns {string} - Tailwind color class
 */
export const getBatchStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'active':
      return 'text-green-600 bg-green-100';
    case 'depleted':
      return 'text-gray-600 bg-gray-100';
    case 'expired':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

/**
 * Check if batch is expiring soon (within 30 days)
 * 
 * @param {string} expiryDate - ISO date string
 * @returns {boolean}
 */
export const isBatchExpiringSoon = (expiryDate) => {
  if (!expiryDate) return false;
  
  const expiry = new Date(expiryDate);
  const today = new Date();
  const daysUntilExpiry = Math.floor((expiry - today) / (1000 * 60 * 60 * 24));
  
  return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
};

/**
 * Format price for display (Philippine Peso)
 * 
 * @param {number} price - Price value
 * @returns {string} - Formatted price with ₱ symbol
 */
export const formatPrice = (price) => {
  if (price === null || price === undefined) return '₱0.00';
  return `₱${parseFloat(price).toFixed(2)}`;
};

/**
 * Validate batch pricing before submission
 * 
 * @param {number} purchasePrice - Cost from supplier
 * @param {number} sellingPrice - Price to customer
 * @returns {{isValid: boolean, warnings: string[]}}
 */
export const validateBatchPricing = (purchasePrice, sellingPrice) => {
  const warnings = [];
  
  if (!purchasePrice || purchasePrice <= 0) {
    warnings.push('Purchase price must be greater than 0');
  }
  
  if (!sellingPrice || sellingPrice <= 0) {
    warnings.push('Selling price must be greater than 0');
  }
  
  if (purchasePrice && sellingPrice && sellingPrice < purchasePrice) {
    warnings.push('⚠️ Selling price is below purchase price (negative margin)');
  }
  
  const markup = calculateMarkup(purchasePrice, sellingPrice);
  if (markup < 0) {
    warnings.push(`⚠️ Loss: ${Math.abs(markup).toFixed(2)}% margin`);
  } else if (markup < 10) {
    warnings.push(`⚠️ Low margin: ${markup.toFixed(2)}%`);
  }
  
  return {
    isValid: warnings.length === 0 || (warnings.length === 1 && warnings[0].includes('Low margin')),
    warnings
  };
};

export default {
  refreshProductPrice,
  refreshAllProductPrices,
  getCurrentBatchPrice,
  getProductBatches,
  calculateMarkup,
  formatBatchNumber,
  getBatchStatusColor,
  isBatchExpiringSoon,
  formatPrice,
  validateBatchPricing
};
