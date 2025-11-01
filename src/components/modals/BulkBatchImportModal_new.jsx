import React, { useState, useEffect } from "react";
import {
  X,
  Upload,
  AlertCircle,
  CheckCircle2,
  Info,
  AlertTriangle,
  Package,
  Search,
} from "lucide-react";
import { useToast } from "../ui/Toast";
import { ProductService } from "../../services/domains/inventory/productService";
import { UnifiedSpinner } from "../ui/loading/UnifiedSpinner";

const BulkBatchImportModal = ({ isOpen, onClose, onSuccess }) => {
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null);
  const { success: showSuccess, info: showInfo, error: showError } = useToast();

  // Load low-stock items when modal opens
  useEffect(() => {
    if (isOpen) {
      loadLowStockItems();
    }
  }, [isOpen]);

  const loadLowStockItems = async () => {
    try {
      setLoadingItems(true);
      const allProducts = await ProductService.getProducts();

      const lowStock = allProducts
        .filter((product) => {
          const currentStock =
            product.stock_in_pieces || product.stock_quantity || 0;
          const minimumStock = product.reorder_level || 10;
          return currentStock === 0 || currentStock <= minimumStock;
        })
        .map((product) => ({
          id: product.id,
          genericName: product.generic_name || product.name || "Unknown",
          brandName: product.brand_name || "Generic",
          currentStock: product.stock_in_pieces || product.stock_quantity || 0,
          reorderLevel: product.reorder_level || 10,
          stockStatus:
            (product.stock_in_pieces || product.stock_quantity || 0) === 0
              ? "OUT_OF_STOCK"
              : "LOW_STOCK",
          quantityToAdd: "",
          expiryDate: "",
          notes: "",
        }));

      setLowStockItems(lowStock);
    } catch (error) {
      console.error("Error loading low-stock items:", error);
      showError("Failed to load low-stock items");
    } finally {
      setLoadingItems(false);
    }
  };

  const updateItemField = (index, field, value) => {
    setLowStockItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleQuickImport = async () => {
    const itemsToImport = lowStockItems.filter(
      (item) =>
        item.quantityToAdd &&
        parseInt(item.quantityToAdd) > 0 &&
        item.expiryDate
    );

    if (itemsToImport.length === 0) {
      showError(
        "Please add quantity and expiry date for at least one product"
      );
      return;
    }

    setImporting(true);
    const importResults = {
      total: itemsToImport.length,
      successful: 0,
      failed: 0,
      errors: [],
    };

    try {
      for (let i = 0; i < itemsToImport.length; i++) {
        const item = itemsToImport[i];
        try {
          // Validate expiry date
          const expiryDate = new Date(item.expiryDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          if (isNaN(expiryDate.getTime())) {
            throw new Error("Invalid expiry date");
          }

          if (expiryDate < today) {
            throw new Error("Expiry date cannot be in the past");
          }

          // Add the batch
          const batchData = {
            productId: item.id,
            quantity: parseInt(item.quantityToAdd),
            expiryDate: item.expiryDate,
            supplier: null,
            notes:
              item.notes ||
              `Bulk import - ${item.genericName} (${item.brandName})`,
          };

          await ProductService.addProductBatch(batchData);
          importResults.successful++;
        } catch (error) {
          importResults.failed++;
          importResults.errors.push(
            `${item.genericName} (${item.brandName}): ${error.message}`
          );
        }
      }

      setResults(importResults);

      if (importResults.successful > 0) {
        showSuccess(
          `Successfully imported ${importResults.successful} batch${
            importResults.successful > 1 ? "es" : ""
          }!${importResults.failed > 0 ? ` (${importResults.failed} failed)` : ""}`,
          {
            duration: 5000,
          }
        );
        onSuccess?.(importResults);

        // Reload low-stock items to reflect changes
        setTimeout(() => {
          loadLowStockItems();
        }, 1000);
      }
    } catch (error) {
      showError(`Import failed: ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

  const reset = () => {
    setResults(null);
    loadLowStockItems();
  };

  const filteredItems = lowStockItems.filter(
    (item) =>
      item.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.brandName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-3 rounded-lg">
              <Package className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Quick Bulk Restock
              </h3>
              <p className="text-sm text-gray-600">
                Fill quantities and expiry dates to restock low-stock items
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900 mb-1">
                    Quick Restock - Low Stock Items ({lowStockItems.length})
                  </h4>
                  <p className="text-sm text-blue-800">
                    Fill in the quantity and expiry date for items you want to
                    restock. Leave blank to skip. Changes are saved when you click "Import Batches".
                  </p>
                </div>
              </div>
            </div>

            {/* Search */}
            {lowStockItems.length > 5 && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search medicines..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            )}

            {/* Loading State */}
            {loadingItems ? (
              <div className="flex flex-col items-center justify-center py-12">
                <UnifiedSpinner variant="ring" size="lg" color="green" />
                <p className="mt-4 text-gray-600">Loading low-stock items...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-900 font-medium text-lg mb-1">
                  {searchTerm
                    ? "No items match your search"
                    : "No low-stock items found"}
                </p>
                <p className="text-sm text-gray-500">
                  {searchTerm
                    ? "Try a different search term"
                    : "All products are well-stocked! 🎉"}
                </p>
              </div>
            ) : (
              // Items Table
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-[calc(90vh-380px)]">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Medicine
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Current Stock
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Quantity to Add
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Expiry Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Notes (Optional)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredItems.map((item, index) => {
                        const originalIndex = lowStockItems.indexOf(item);
                        const hasData = item.quantityToAdd && item.expiryDate;
                        return (
                          <tr
                            key={item.id}
                            className={`hover:bg-gray-50 transition-colors ${
                              hasData ? "bg-green-50/30" : ""
                            }`}
                          >
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium text-gray-900">
                                  {item.genericName}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {item.brandName}
                                </p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${
                                  item.currentStock === 0
                                    ? "bg-red-100 text-red-700"
                                    : "bg-orange-100 text-orange-700"
                                }`}
                              >
                                {item.currentStock}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                  item.stockStatus === "OUT_OF_STOCK"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-orange-100 text-orange-700"
                                }`}
                              >
                                {item.stockStatus === "OUT_OF_STOCK"
                                  ? "Out of Stock"
                                  : "Low Stock"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                min="1"
                                placeholder="0"
                                value={item.quantityToAdd}
                                onChange={(e) =>
                                  updateItemField(
                                    originalIndex,
                                    "quantityToAdd",
                                    e.target.value
                                  )
                                }
                                className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="date"
                                value={item.expiryDate}
                                onChange={(e) =>
                                  updateItemField(
                                    originalIndex,
                                    "expiryDate",
                                    e.target.value
                                  )
                                }
                                min={new Date().toISOString().split("T")[0]}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                placeholder="Optional notes..."
                                value={item.notes}
                                onChange={(e) =>
                                  updateItemField(
                                    originalIndex,
                                    "notes",
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Results */}
            {results && (
              <div
                className={`border rounded-lg p-4 ${
                  results.successful > 0
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <h4
                  className={`font-semibold mb-2 flex items-center ${
                    results.successful > 0 ? "text-green-900" : "text-red-900"
                  }`}
                >
                  {results.successful > 0 ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 mr-2" />
                      Import Successful!
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-5 w-5 mr-2" />
                      Import Failed
                    </>
                  )}
                </h4>
                <div
                  className={`text-sm space-y-1 ${
                    results.successful > 0 ? "text-green-800" : "text-red-800"
                  }`}
                >
                  <p>• Total items processed: {results.total}</p>
                  <p>• Successfully imported: {results.successful}</p>
                  {results.failed > 0 && <p>• Failed: {results.failed}</p>}
                </div>
                {results.errors.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-red-800 mb-1">
                      Errors:
                    </p>
                    <ul className="text-xs text-red-700 space-y-1 max-h-32 overflow-y-auto bg-white rounded p-2">
                      {results.errors.map((error, i) => (
                        <li key={i}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-between items-center">
          <button
            onClick={reset}
            className="text-gray-600 hover:text-gray-800 font-medium transition-colors"
            disabled={importing}
          >
            Reset
          </button>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={importing}
            >
              Close
            </button>
            <button
              onClick={handleQuickImport}
              disabled={importing || filteredItems.length === 0}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 flex items-center space-x-2"
            >
              {importing ? (
                <>
                  <UnifiedSpinner variant="dots" size="xs" color="white" />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span>Import Batches</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkBatchImportModal;
