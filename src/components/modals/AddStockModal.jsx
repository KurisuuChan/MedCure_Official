import React, { useState, useContext } from "react";
import { X, Package, Calendar, AlertCircle, DollarSign, TrendingUp } from "lucide-react";
import StandardizedProductDisplay from "../ui/StandardizedProductDisplay";
import { useToast } from "../ui/Toast";
import { UnifiedSpinner } from "../ui/loading/UnifiedSpinner";
import { AuthContext } from "../../contexts/AuthContext";
import NotificationService from "../../services/notifications/NotificationService";

const AddStockModal = ({ isOpen, onClose, product, onSuccess }) => {
  const { success: showSuccess } = useToast();
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    quantity: "",
    expiryDate: "",
    purchasePrice: "",
    sellingPrice: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastBatchPrices, setLastBatchPrices] = useState(null);
  const [loadingPrices, setLoadingPrices] = useState(false);

  // Fetch last batch prices when modal opens
  React.useEffect(() => {
    if (isOpen && product?.id) {
      fetchLastBatchPrices();
    }
  }, [isOpen, product]);

  const fetchLastBatchPrices = async () => {
    try {
      setLoadingPrices(true);
      const { supabase } = await import("../../config/supabase");
      
      // Fetch the most recent batch for this product
      const { data, error } = await supabase
        .from("product_batches")
        .select("purchase_price, selling_price, created_at")
        .eq("product_id", product.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(); // Use maybeSingle() instead of single() to avoid errors when no batch exists

      if (!error && data && (data.purchase_price || data.selling_price)) {
        // Found previous batch with prices
        const lastPrices = {
          purchase: data.purchase_price || 0,
          selling: data.selling_price || product?.price_per_piece || 0,
        };
        setLastBatchPrices(lastPrices);
        
        // Auto-fill form with last batch prices
        setFormData((prev) => ({
          ...prev,
          purchasePrice: lastPrices.purchase || "",
          sellingPrice: lastPrices.selling || product?.price_per_piece || "",
        }));
      } else {
        // No previous batch found - check if product has prices
        const productPrices = {
          purchase: product?.cost_price || 0,
          selling: product?.price_per_piece || 0,
        };
        
        // Only set lastBatchPrices if product has prices
        if (productPrices.purchase > 0 || productPrices.selling > 0) {
          setLastBatchPrices(productPrices);
        } else {
          setLastBatchPrices(null);
        }
        
        // Auto-fill form with product prices if available
        setFormData((prev) => ({
          ...prev,
          purchasePrice: product?.cost_price || "",
          sellingPrice: product?.price_per_piece || "",
        }));
      }
      setError("");
    } catch (err) {
      console.error("Error fetching last batch prices:", err);
      // Fallback to product prices
      const productPrices = {
        purchase: product?.cost_price || 0,
        selling: product?.price_per_piece || 0,
      };
      
      if (productPrices.purchase > 0 || productPrices.selling > 0) {
        setLastBatchPrices(productPrices);
      } else {
        setLastBatchPrices(null);
      }
      
      setFormData((prev) => ({
        ...prev,
        purchasePrice: product?.cost_price || "",
        sellingPrice: product?.price_per_piece || "",
      }));
      setError("");
    } finally {
      setLoadingPrices(false);
    }
  };

  const usePreviousPrices = () => {
    if (lastBatchPrices) {
      setFormData((prev) => ({
        ...prev,
        purchasePrice: lastBatchPrices.purchase,
        sellingPrice: lastBatchPrices.selling,
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      setError("Please enter a valid quantity");
      return;
    }

    if (!formData.expiryDate) {
      setError("Please select an expiry date");
      return;
    }

    // Validate pricing (optional but recommended)
    const purchasePrice = formData.purchasePrice ? parseFloat(formData.purchasePrice) : null;
    const sellingPrice = formData.sellingPrice ? parseFloat(formData.sellingPrice) : null;

    if (purchasePrice !== null && purchasePrice < 0) {
      setError("Purchase price cannot be negative");
      return;
    }

    if (sellingPrice !== null && sellingPrice <= 0) {
      setError("Selling price must be greater than zero");
      return;
    }

    // Warn about negative margin
    if (purchasePrice !== null && sellingPrice !== null && sellingPrice < purchasePrice) {
      const confirmNegativeMargin = window.confirm(
        `⚠️ Warning: Selling price (₱${sellingPrice}) is less than purchase price (₱${purchasePrice}).\n\nThis will result in a loss. Continue anyway?`
      );
      if (!confirmNegativeMargin) {
        return;
      }
    }

    setLoading(true);
    setError("");

    try {
      const { ProductService } = await import(
        "../../services/domains/inventory/productService"
      );

      const batchData = {
        productId: product.id,
        quantity: parseInt(formData.quantity),
        expiryDate: formData.expiryDate,
        purchase_price: purchasePrice,
        selling_price: sellingPrice,
        supplier_name: null,
        notes: `Added via Add Stock modal`,
      };

      const result = await ProductService.addProductBatch(batchData);
      const resultData = Array.isArray(result) ? result[0] : result;

      if (resultData && resultData.success) {
        const productName =
          product?.brand_name || product?.generic_name || "product";

        // Build success message
        let successMessage = `Successfully added ${formData.quantity} units to ${productName}!`;
        if (sellingPrice && purchasePrice) {
          const markup = (((sellingPrice - purchasePrice) / purchasePrice) * 100).toFixed(1);
          successMessage += ` (${markup}% markup)`;
        }

        // ✅ Show success toast notification
        showSuccess(successMessage, {
          duration: 4000,
          action: {
            label: "View Batches",
            onClick: () => {},
          },
        });

        // 📬 Send notification about stock added and batch received
        if (user?.id) {
          try {
            const batchNumber =
              resultData.batch_number || resultData.batch_id || "N/A";

            // Get updated stock level from product or calculate
            const newStockLevel =
              (product?.stock_in_pieces || 0) + parseInt(formData.quantity);

            // Notify about stock added
            await NotificationService.notifyStockAdded(
              product.id,
              productName,
              parseInt(formData.quantity),
              batchNumber,
              newStockLevel,
              user.id
            );

            // Notify about batch received
            await NotificationService.notifyBatchReceived(
              batchNumber,
              productName,
              parseInt(formData.quantity),
              formData.expiryDate,
              user.id
            );
          } catch (notifyError) {
            console.error("⚠️ Failed to send notification:", notifyError);
            // Don't block the success flow if notification fails
          }
        }

        onSuccess &&
          onSuccess({
            success: true,
            batchId: resultData.batch_id,
            data: batchData,
            result: resultData,
          });
        onClose();
      } else if (resultData && resultData.message) {
        throw new Error(resultData.message);
      } else {
        throw new Error("Failed to add batch - invalid response");
      }
    } catch (error) {
      console.error("Error adding batch:", error);

      if (
        error.message?.includes("function") ||
        error.message?.includes("does not exist")
      ) {
        setError(
          "Batch tracking functions not found in database. Please run the SQL setup in Supabase first."
        );
      } else if (error.message?.includes("structure of query does not match")) {
        setError(
          "Database schema mismatch. Please ensure your RPC functions are up to date."
        );
      } else {
        setError(error.message || "Failed to add stock. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            Add Stock
          </h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {product && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-600 mb-3 uppercase tracking-wider">
                  Product Summary
                </h3>
                <StandardizedProductDisplay
                  product={product}
                  size="default"
                  showStock={true}
                  showPrice={false}
                  isReadOnly={true}
                  className="border border-blue-200 bg-blue-50"
                />

                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm font-medium text-green-800">
                      Automated Batch Number
                    </span>
                  </div>
                  <p className="text-sm text-green-700">
                    A unique batch number will be automatically generated when
                    you save this stock entry.
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Format: BT + Date (MMDDYY) + Incremental ID (e.g.,
                    BT100625-001)
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-600 mb-3 uppercase tracking-wider">
                Stock Details
              </h3>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-800 text-sm font-medium">Error</p>
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="quantity"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Quantity to Add *
                  </label>
                  <div className="relative">
                    <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      id="quantity"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      placeholder="Enter quantity"
                      min="1"
                      required
                      disabled={loading}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-lg"
                    />
                  </div>
                </div>

                {/* Use Previous Price Button */}
                {lastBatchPrices && !loadingPrices && (lastBatchPrices.purchase > 0 || lastBatchPrices.selling > 0) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900">
                          Previous Prices
                        </p>
                        <p className="text-xs text-blue-700 mt-1">
                          {lastBatchPrices.purchase > 0 && (
                            <>Purchase: ₱{lastBatchPrices.purchase.toFixed(2)}</>
                          )}
                          {lastBatchPrices.purchase > 0 && lastBatchPrices.selling > 0 && " | "}
                          {lastBatchPrices.selling > 0 && (
                            <>Selling: ₱{lastBatchPrices.selling.toFixed(2)}</>
                          )}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={usePreviousPrices}
                        disabled={loading || loadingPrices}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <DollarSign className="w-4 h-4" />
                        Use These
                      </button>
                    </div>
                  </div>
                )}
                
                {loadingPrices && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <UnifiedSpinner variant="dots" size="xs" color="gray" />
                      <p className="text-sm text-gray-600">Loading previous prices...</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="purchasePrice"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Purchase Price ₱
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        id="purchasePrice"
                        name="purchasePrice"
                        value={formData.purchasePrice}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        disabled={loading}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Cost from supplier</p>
                  </div>

                  <div>
                    <label
                      htmlFor="sellingPrice"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Selling Price ₱
                    </label>
                    <div className="relative">
                      <TrendingUp className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        id="sellingPrice"
                        name="sellingPrice"
                        value={formData.sellingPrice}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        disabled={loading}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                          formData.purchasePrice && 
                          formData.sellingPrice && 
                          parseFloat(formData.sellingPrice) < parseFloat(formData.purchasePrice)
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-300'
                        }`}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Price to customer</p>
                  </div>
                </div>

                {/* Markup Display */}
                {formData.purchasePrice && formData.sellingPrice && (
                  <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Markup:</span>
                      <span className={`text-lg font-bold ${
                        parseFloat(formData.sellingPrice) < parseFloat(formData.purchasePrice)
                          ? 'text-red-600'
                          : parseFloat(formData.sellingPrice) === parseFloat(formData.purchasePrice)
                          ? 'text-yellow-600'
                          : 'text-green-600'
                      }`}>
                        {(() => {
                          const purchase = parseFloat(formData.purchasePrice);
                          const selling = parseFloat(formData.sellingPrice);
                          if (purchase > 0) {
                            const markup = ((selling - purchase) / purchase) * 100;
                            return `${markup.toFixed(1)}%`;
                          }
                          return '0%';
                        })()}
                      </span>
                    </div>
                    {parseFloat(formData.sellingPrice) < parseFloat(formData.purchasePrice) && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Warning: Negative margin (selling below cost)
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="expiryDate"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Expiry Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      id="expiryDate"
                      name="expiryDate"
                      value={formData.expiryDate}
                      onChange={handleInputChange}
                      min={new Date().toISOString().split("T")[0]}
                      required
                      disabled={loading}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-lg"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={loading}
                    className="flex-1 px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      loading || !formData.quantity || !formData.expiryDate
                    }
                    className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 hover:scale-105 hover:shadow-lg text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <UnifiedSpinner
                          variant="dots"
                          size="xs"
                          color="white"
                        />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Package className="w-4 h-4" />
                        Add Stock
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-xs font-medium mb-1">
                  🤖 Automated Batch Tracking
                </p>
                <p className="text-blue-700 text-xs">
                  This will create a new batch record with an automatically
                  generated batch number and update your inventory.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddStockModal;
