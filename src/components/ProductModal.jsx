import React, { useState, useEffect } from "react";
import { X, Save, Package, Barcode, Calendar, DollarSign } from "lucide-react";
import { supabase } from "../lib/supabase";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Card } from "./ui/Card";
import { LoadingSpinner } from "./ui/LoadingSpinner";

export const ProductModal = ({
  isOpen,
  onClose,
  product = null,
  categories = [],
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    generic_name: "",
    brand: "",
    category_id: "",
    description: "",
    cost_price: "",
    selling_price: "",
    stock_quantity: "",
    min_stock_level: 10,
    max_stock_level: 1000,
    pieces_per_sheet: 1,
    sheets_per_box: 1,
    manufacturing_date: "",
    expiry_date: "",
    supplier: "",
    location: "",
    barcode: "",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Initialize form data when product changes
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        generic_name: product.generic_name || "",
        brand: product.brand || "",
        category_id: product.category_id || "",
        description: product.description || "",
        cost_price: product.cost_price || "",
        selling_price: product.selling_price || "",
        stock_quantity: product.stock_quantity || "",
        min_stock_level: product.min_stock_level || 10,
        max_stock_level: product.max_stock_level || 1000,
        pieces_per_sheet: product.pieces_per_sheet || 1,
        sheets_per_box: product.sheets_per_box || 1,
        manufacturing_date: product.manufacturing_date || "",
        expiry_date: product.expiry_date || "",
        supplier: product.supplier || "",
        location: product.location || "",
        barcode: product.barcode || "",
      });
    } else {
      // Reset form for new product
      setFormData({
        name: "",
        generic_name: "",
        brand: "",
        category_id: "",
        description: "",
        cost_price: "",
        selling_price: "",
        stock_quantity: "",
        min_stock_level: 10,
        max_stock_level: 1000,
        pieces_per_sheet: 1,
        sheets_per_box: 1,
        manufacturing_date: "",
        expiry_date: "",
        supplier: "",
        location: "",
        barcode: "",
      });
    }
    setErrors({});
  }, [product, isOpen]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Product name is required";
    }

    if (!formData.category_id) {
      newErrors.category_id = "Category is required";
    }

    if (!formData.selling_price || parseFloat(formData.selling_price) <= 0) {
      newErrors.selling_price = "Valid selling price is required";
    }

    if (!formData.cost_price || parseFloat(formData.cost_price) < 0) {
      newErrors.cost_price = "Valid cost price is required";
    }

    if (parseFloat(formData.cost_price) > parseFloat(formData.selling_price)) {
      newErrors.cost_price = "Cost price cannot be higher than selling price";
    }

    if (!formData.stock_quantity || parseInt(formData.stock_quantity) < 0) {
      newErrors.stock_quantity = "Valid stock quantity is required";
    }

    if (!formData.expiry_date) {
      newErrors.expiry_date = "Expiry date is required";
    }

    const today = new Date().toISOString().split("T")[0];
    if (formData.expiry_date && formData.expiry_date <= today) {
      newErrors.expiry_date = "Expiry date must be in the future";
    }

    if (
      formData.manufacturing_date &&
      formData.expiry_date &&
      formData.manufacturing_date >= formData.expiry_date
    ) {
      newErrors.manufacturing_date =
        "Manufacturing date must be before expiry date";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateBatchNumber = (categoryName) => {
    const prefix = categoryName.substring(0, 3).toUpperCase();
    const date = new Date().toISOString().slice(2, 10).replace(/-/g, "");
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    return `${prefix}${date}${random}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const categoryName =
        categories.find((c) => c.id === formData.category_id)?.name || "GEN";

      const productData = {
        ...formData,
        cost_price: parseFloat(formData.cost_price),
        selling_price: parseFloat(formData.selling_price),
        stock_quantity: parseInt(formData.stock_quantity),
        min_stock_level: parseInt(formData.min_stock_level),
        max_stock_level: parseInt(formData.max_stock_level),
        pieces_per_sheet: parseInt(formData.pieces_per_sheet),
        sheets_per_box: parseInt(formData.sheets_per_box),
      };

      // Generate batch number if not provided
      if (!productData.batch_number && !product) {
        productData.batch_number = generateBatchNumber(categoryName);
      }

      let result;

      if (product) {
        // Update existing product
        result = await supabase
          .from("products")
          .update(productData)
          .eq("id", product.id)
          .select();
      } else {
        // Create new product
        result = await supabase.from("products").insert([productData]).select();
      }

      if (result.error) {
        throw result.error;
      }

      onSave();
      onClose();
    } catch (error) {
      console.error("Error saving product:", error);
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Package className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">
                {product ? "Edit Product" : "Add New Product"}
              </h2>
            </div>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
                <Package className="h-5 w-5" />
                Basic Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Input
                    label="Product Name *"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    error={errors.name}
                    placeholder="Enter product name"
                  />
                </div>

                <div>
                  <Input
                    label="Generic Name"
                    value={formData.generic_name}
                    onChange={(e) =>
                      handleChange("generic_name", e.target.value)
                    }
                    placeholder="Enter generic name"
                  />
                </div>

                <div>
                  <Input
                    label="Brand"
                    value={formData.brand}
                    onChange={(e) => handleChange("brand", e.target.value)}
                    placeholder="Enter brand name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) =>
                      handleChange("category_id", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {errors.category_id && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.category_id}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Enter product description"
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  rows={3}
                />
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Input
                    label="Cost Price *"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cost_price}
                    onChange={(e) => handleChange("cost_price", e.target.value)}
                    error={errors.cost_price}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Input
                    label="Selling Price *"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.selling_price}
                    onChange={(e) =>
                      handleChange("selling_price", e.target.value)
                    }
                    error={errors.selling_price}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Inventory */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
                <Package className="h-5 w-5" />
                Inventory
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Input
                    label="Stock Quantity *"
                    type="number"
                    min="0"
                    value={formData.stock_quantity}
                    onChange={(e) =>
                      handleChange("stock_quantity", e.target.value)
                    }
                    error={errors.stock_quantity}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Input
                    label="Min Stock Level"
                    type="number"
                    min="0"
                    value={formData.min_stock_level}
                    onChange={(e) =>
                      handleChange("min_stock_level", e.target.value)
                    }
                    placeholder="10"
                  />
                </div>

                <div>
                  <Input
                    label="Max Stock Level"
                    type="number"
                    min="0"
                    value={formData.max_stock_level}
                    onChange={(e) =>
                      handleChange("max_stock_level", e.target.value)
                    }
                    placeholder="1000"
                  />
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Important Dates
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Input
                    label="Manufacturing Date"
                    type="date"
                    value={formData.manufacturing_date}
                    onChange={(e) =>
                      handleChange("manufacturing_date", e.target.value)
                    }
                    error={errors.manufacturing_date}
                  />
                </div>

                <div>
                  <Input
                    label="Expiry Date *"
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) =>
                      handleChange("expiry_date", e.target.value)
                    }
                    error={errors.expiry_date}
                  />
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
                <Barcode className="h-5 w-5" />
                Additional Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Input
                    label="Supplier"
                    value={formData.supplier}
                    onChange={(e) => handleChange("supplier", e.target.value)}
                    placeholder="Enter supplier name"
                  />
                </div>

                <div>
                  <Input
                    label="Location"
                    value={formData.location}
                    onChange={(e) => handleChange("location", e.target.value)}
                    placeholder="Storage location"
                  />
                </div>

                <div>
                  <Input
                    label="Barcode"
                    value={formData.barcode}
                    onChange={(e) => handleChange("barcode", e.target.value)}
                    placeholder="Product barcode"
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {errors.submit && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-destructive text-sm">{errors.submit}</p>
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end gap-4 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {product ? "Update" : "Create"} Product
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};
