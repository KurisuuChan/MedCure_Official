import React from "react";
import PropTypes from "prop-types";
import { X, Eye } from "lucide-react";

const DetailField = ({ label, value }) => (
  <div>
    <p className="text-sm font-medium text-gray-500">{label}</p>
    <p className="mt-1 text-gray-800">{value || "N/A"}</p>
  </div>
);

DetailField.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

const ViewProductModal = ({ isOpen, onClose, product }) => {
  if (!isOpen) return null;

  const formatPrice = (price) => {
    if (price === null || price === undefined) {
      return "N/A";
    }
    return `₱${price.toFixed(2)}`;
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-2xl transform transition-all">
        <div className="flex items-center justify-between mb-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <Eye className="text-blue-600" size={24} />
            <h2 className="text-xl font-bold text-gray-900">{product.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <DetailField label="Medicine Category" value={product.category} />
          <DetailField label="Buy Price" value={formatPrice(product.price)} />
          <DetailField label="Expiry Date" value={product.expireDate} />
          <DetailField label="Product Type" value={product.productType} />
        </div>

        <div className="mt-6">
          <p className="text-sm font-medium text-gray-500">
            Medicine Description
          </p>
          <div className="mt-1 w-full p-4 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 text-sm min-h-[100px]">
            {product.description || "No description available."}
          </div>
        </div>

        <div className="mt-8 text-right">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

ViewProductModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  product: PropTypes.shape({
    name: PropTypes.string,
    category: PropTypes.string,
    price: PropTypes.number,
    expireDate: PropTypes.string,
    productType: PropTypes.string,
    description: PropTypes.string,
  }).isRequired,
};

export default ViewProductModal;
