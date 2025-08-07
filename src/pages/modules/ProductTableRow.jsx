import React from "react";
import PropTypes from "prop-types";
import { Eye, Pencil } from "lucide-react";

const ProductTableRow = ({
  product,
  isSelected,
  onSelectItem,
  onViewProduct,
  onEditProduct,
}) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case "Available":
        return (
          <span className="px-3 py-1 text-xs font-semibold leading-tight text-green-700 bg-green-100 rounded-full">
            {status}
          </span>
        );
      case "Unavailable":
        return (
          <span className="px-3 py-1 text-xs font-semibold leading-tight text-red-700 bg-red-100 rounded-full">
            {status}
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 text-xs font-semibold leading-tight text-gray-700 bg-gray-100 rounded-full">
            {status}
          </span>
        );
    }
  };

  return (
    <tr
      className={`transition-colors group align-middle ${
        isSelected ? "bg-blue-50" : "hover:bg-gray-50"
      }`}
    >
      <td className="px-6 py-4">
        <input
          type="checkbox"
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          checked={isSelected}
          onChange={() => onSelectItem(product.id)}
        />
      </td>
      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
        {product.medicineId}
      </td>
      <td className="px-6 py-4 font-medium text-gray-900">{product.name}</td>
      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
        {product.category}
      </td>
      <td className="px-6 py-4 text-sm text-gray-600 text-center">
        {product.quantity}
      </td>
      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
        {product.expireDate}
      </td>
      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
        {product.productType}
      </td>
      <td className="px-6 py-4 text-center">
        {getStatusBadge(product.status)}
      </td>
      <td className="px-6 py-4 text-sm text-center">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => onViewProduct(product)}
            className="p-2 rounded-full text-gray-400 hover:bg-blue-100 hover:text-blue-600 transition-colors"
            title="View Details"
          >
            <Eye size={18} />
          </button>
          <button
            onClick={() => onEditProduct(product)}
            className="p-2 rounded-full text-gray-400 hover:bg-green-100 hover:text-green-600 transition-colors"
            title="Edit Product"
          >
            <Pencil size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
};

ProductTableRow.propTypes = {
  product: PropTypes.object.isRequired,
  isSelected: PropTypes.bool.isRequired,
  onSelectItem: PropTypes.func.isRequired,
  onViewProduct: PropTypes.func.isRequired,
  onEditProduct: PropTypes.func.isRequired,
};

export default ProductTableRow;
