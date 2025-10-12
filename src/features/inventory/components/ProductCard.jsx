import React from "react";
import {
  Package,
  AlertTriangle,
  Calendar,
  Edit,
  Eye,
  Trash2,
  Archive,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Pill,
} from "lucide-react";
import { formatCurrency } from "../../../utils/formatting";
import { formatDate } from "../../../utils/dateTime";
import {
  getStockStatusBadge,
  getExpiryStatusBadge,
} from "../../../utils/productUtils";

export default function ProductCard({
  product,
  onEdit,
  onView,
  onDelete,
  showActions = true,
}) {
  // 🔍 DEBUG: Log product stock data
  if (import.meta.env.DEV) {
    console.log(`🃏 ProductCard for "${product.generic_name}":`, {
      stock_in_pieces: product.stock_in_pieces,
      stock_quantity: product.stock_quantity,
      reorder_level: product.reorder_level,
    });
  }

  const stockBadge = getStockStatusBadge(product);
  const expiryBadge = getExpiryStatusBadge(product);

  const getExpiryText = (expiryDate) => {
    if (!expiryDate) return "No expiry";

    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) return "Expired";
    if (daysUntilExpiry === 0) return "Expires today";
    if (daysUntilExpiry <= 30) return `Expires in ${daysUntilExpiry} days`;
    return formatDate(expiryDate);
  };

  const getDrugClassificationBadge = (classification) => {
    switch (classification) {
      case "Prescription (Rx)":
        return {
          icon: ShieldAlert,
          bgColor: "bg-red-100",
          textColor: "text-red-800",
          borderColor: "border-red-200",
          label: "Prescription",
        };
      case "Over-the-Counter (OTC)":
        return {
          icon: ShieldCheck,
          bgColor: "bg-green-100",
          textColor: "text-green-800",
          borderColor: "border-green-200",
          label: "Over-the-Counter",
        };
      case "Controlled Substance":
        return {
          icon: Shield,
          bgColor: "bg-purple-100",
          textColor: "text-purple-800",
          borderColor: "border-purple-200",
          label: "Controlled Substance",
        };
      default:
        return {
          icon: Pill,
          bgColor: "bg-gray-100",
          textColor: "text-gray-800",
          borderColor: "border-gray-200",
          label: "N/A",
        };
    }
  };

  const classificationBadge = getDrugClassificationBadge(
    product.drug_classification
  );

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm hover:shadow-xl hover:border-blue-300 hover:scale-[1.02] transition-all duration-300 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2 flex-wrap">
              {product.is_archived && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                  <Archive className="h-3 w-3 mr-1" />
                  Archived
                </span>
              )}
              {/* Drug Classification Badge */}
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border-2 ${classificationBadge.bgColor} ${classificationBadge.textColor} ${classificationBadge.borderColor} shadow-sm`}
              >
                <classificationBadge.icon className="h-3 w-3 mr-1" />
                {classificationBadge.label}
              </span>
            </div>

            {/* Brand Name - Large and Prominent */}
            <h3 className="font-bold text-gray-900 text-xl leading-tight mb-1 line-clamp-2">
              {product.brand_name || product.brand || "Unknown Brand"}
            </h3>

            {/* Generic Name - Below Brand Name */}
            <p className="text-gray-600 font-medium text-base mb-2 line-clamp-1">
              {product.generic_name || product.name || "Unknown Generic"}
            </p>

            {/* Dosage Strength - Subtle */}
            {product.dosage_strength && (
              <div className="mb-1">
                <span className="text-xs text-gray-500 font-medium">
                  {product.dosage_strength}
                </span>
              </div>
            )}

            {/* Dosage Form - Highlighted */}
            {product.dosage_form && (
              <div className="flex items-center space-x-1 mb-2">
                <Pill className="h-3 w-3 text-purple-600" />
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                  {product.dosage_form}
                </span>
              </div>
            )}

            {/* Category */}
            <div className="inline-flex items-center space-x-2 text-sm bg-white rounded-lg px-2 py-1 border border-gray-200">
              <Package className="h-3 w-3 text-gray-400" />
              <span className="text-gray-500">Category:</span>
              <span className="font-semibold text-gray-700">
                {product.category}
              </span>
            </div>
          </div>

          {showActions && (
            <div className="flex flex-col space-y-1 ml-3">
              <button
                onClick={() => onView(product)}
                className="group p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-110"
                title="View Details"
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                onClick={() => onEdit(product)}
                className="group p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200 hover:scale-110"
                title="Edit Product"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(product)}
                className="group p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110"
                title="Delete Product"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 bg-white">
        {/* Price */}
        <div className="text-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 border-2 border-blue-200">
          <div className="text-3xl font-bold text-blue-900">
            {formatCurrency(product.price_per_piece)}
          </div>
          <div className="text-sm text-blue-600 font-medium">per piece</div>
        </div>

        {/* Stock and Expiry */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-600 uppercase tracking-wider font-bold">
                Stock
              </span>
              <Package className="h-4 w-4 text-gray-400" />
            </div>
            <div
              className={`text-center py-2.5 px-3 rounded-xl text-sm font-bold ${stockBadge.bgColor} ${stockBadge.textColor} border-2 ${stockBadge.borderColor} shadow-sm`}
            >
              {product.stock_in_pieces} pcs
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-600 uppercase tracking-wider font-bold">
                Expiry
              </span>
              <Calendar className="h-4 w-4 text-gray-400" />
            </div>
            <div
              className={`text-center py-2.5 px-3 rounded-xl text-xs font-bold ${expiryBadge.bgColor} ${expiryBadge.textColor} border-2 ${expiryBadge.borderColor} shadow-sm`}
            >
              {getExpiryText(product.expiry_date)}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2 pt-2 border-t-2 border-gray-100">
          <div className="flex justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
            <span className="text-gray-600 font-medium">Product ID:</span>
            <span className="text-gray-900 font-mono text-xs font-bold bg-white px-2 py-1 rounded border border-gray-200">
              #{product.id.slice(-8)}
            </span>
          </div>
        </div>

        {/* Low Stock Alert */}
        {product.stock_in_pieces <= product.reorder_level && (
          <div className="flex items-center space-x-2 p-3 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl shadow-sm animate-pulse-subtle">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-amber-900">
                Low Stock Alert
              </div>
              <div className="text-xs text-amber-700 font-medium">
                Reorder level: {product.reorder_level} pieces
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
