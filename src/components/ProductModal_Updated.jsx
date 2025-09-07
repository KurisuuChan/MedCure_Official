import React, { useState, useEffect } from "react";
import {
  X,
  Save,
  Package,
  Calendar,
  DollarSign,
  Box,
  FileText,
} from "lucide-react";
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
    description: "",
    sku: "",
    category_id: "",
    cost_price: "",
    selling_price: "",
    stock_quantity: "",
    reorder_level: 10,
    unit_type: "piece",
    pieces_per_box: 12,
    pieces_per_sheet: 1,
    box_price: "",
    sheet_price: "",
    supplier: "",
    expiry_date: "",
    batch_number: "",
    location: "Main Store",
    is_active: true,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Initialize form data when product changes
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        description: product.description || "",
        sku: product.sku || "",
        category_id: product.category_id || "",
        cost_price: product.cost_price || "",
        selling_price: product.selling_price || "",
        stock_quantity: product.stock_quantity || "",
        reorder_level: product.reorder_level || 10,
        unit_type: product.unit_type || "piece",
        pieces_per_box: product.pieces_per_box || 12,
        pieces_per_sheet: product.pieces_per_sheet || 1,
        box_price: product.box_price || "",
        sheet_price: product.sheet_price || "",
        supplier: product.supplier || "",
        expiry_date: product.expiry_date || "",
        batch_number: product.batch_number || "",
        location: product.location || "Main Store",
        is_active: product.is_active !== undefined ? product.is_active : true,
      });
    } else {
      // Reset form for new product
      setFormData({
        name: "",
        description: "",
        sku: "",
        category_id: "",
        cost_price: "",
        selling_price: "",
        stock_quantity: "",
        reorder_level: 10,
        unit_type: "piece",
        pieces_per_box: 12,
        pieces_per_sheet: 1,
        box_price: "",
        sheet_price: "",
        supplier: "",
        expiry_date: "",
        batch_number: "",
        location: "Main Store",
        is_active: true,
      });
    }
    setErrors({});
  }, [product, isOpen]);

  // Auto-calculate variant prices
  useEffect(() => {
    if (formData.selling_price && formData.pieces_per_box) {
      const basePrice = parseFloat(formData.selling_price) || 0;
      const piecesPerBox = parseInt(formData.pieces_per_box) || 1;
      // 10% discount for bulk purchase
      const calculatedBoxPrice = basePrice * piecesPerBox * 0.9;

      setFormData((prev) => ({
        ...prev,
        box_price: calculatedBoxPrice.toFixed(2),
        sheet_price: basePrice.toFixed(2),
      }));
    }
  }, [formData.selling_price, formData.pieces_per_box]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Product name is required";
    }

    if (!formData.sku.trim()) {
      newErrors.sku = "SKU is required";
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

    if (
      formData.stock_quantity === "" ||
      parseInt(formData.stock_quantity) < 0
    ) {
      newErrors.stock_quantity = "Valid stock quantity is required";
    }

    if (!formData.reorder_level || parseInt(formData.reorder_level) < 0) {
      newErrors.reorder_level = "Valid reorder level is required";
    }

    if (formData.pieces_per_box && parseInt(formData.pieces_per_box) < 1) {
      newErrors.pieces_per_box = "Pieces per box must be at least 1";
    }

    if (formData.pieces_per_sheet && parseInt(formData.pieces_per_sheet) < 1) {
      newErrors.pieces_per_sheet = "Pieces per sheet must be at least 1";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        sku: formData.sku.trim(),
        category_id: formData.category_id || null,
        cost_price: parseFloat(formData.cost_price),
        selling_price: parseFloat(formData.selling_price),
        stock_quantity: parseInt(formData.stock_quantity),
        reorder_level: parseInt(formData.reorder_level),
        unit_type: formData.unit_type,
        pieces_per_box: parseInt(formData.pieces_per_box),
        pieces_per_sheet: parseInt(formData.pieces_per_sheet),
        box_price: parseFloat(formData.box_price),
        sheet_price: parseFloat(formData.sheet_price),
        supplier: formData.supplier.trim(),
        expiry_date: formData.expiry_date || null,
        batch_number: formData.batch_number.trim(),
        location: formData.location.trim(),
        is_active: formData.is_active,
        last_updated: new Date().toISOString(),
      };

      let result;
      if (product) {
        // Update existing product
        result = await supabase
          .from("products")
          .update(productData)
          .eq("id", product.id)
          .select()
          .single();
      } else {
        // Create new product
        result = await supabase
          .from("products")
          .insert([productData])
          .select()
          .single();
      }

      if (result.error) {
        throw result.error;
      }

      onSave?.(result.data);
      onClose();
    } catch (error) {
      console.error("Error saving product:", error);
      setErrors({
        submit: error.message || "Failed to save product",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-background border-b p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {product ? "Edit Product" : "Add New Product"}
            </h2>
            <p className="text-muted-foreground">
              {product
                ? "Update product information"
                : "Enter product details with variant support"}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.submit && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-destructive text-sm">{errors.submit}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
                <Package className="h-5 w-5" />
                Basic Information
              </h3>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Product Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter product name"
                  error={errors.name}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  SKU *
                </label>
                <Input
                  value={formData.sku}
                  onChange={(e) => handleInputChange("sku", e.target.value)}
                  placeholder="e.g., PARA-500, AMOX-250"
                  error={errors.sku}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description
                </label>
                <Input
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  placeholder="Product description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Category *
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) =>
                    handleInputChange("category_id", e.target.value)
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.category_id && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.category_id}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Supplier
                </label>
                <Input
                  value={formData.supplier}
                  onChange={(e) =>
                    handleInputChange("supplier", e.target.value)
                  }
                  placeholder="Supplier name"
                />
              </div>
            </div>

            {/* Pricing & Stock */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing & Stock
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Cost Price *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cost_price}
                    onChange={(e) =>
                      handleInputChange("cost_price", e.target.value)
                    }
                    placeholder="0.00"
                    error={errors.cost_price}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Selling Price (per piece) *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.selling_price}
                    onChange={(e) =>
                      handleInputChange("selling_price", e.target.value)
                    }
                    placeholder="0.00"
                    error={errors.selling_price}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Stock Quantity (in pieces) *
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.stock_quantity}
                    onChange={(e) =>
                      handleInputChange("stock_quantity", e.target.value)
                    }
                    placeholder="0"
                    error={errors.stock_quantity}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Reorder Level *
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.reorder_level}
                    onChange={(e) =>
                      handleInputChange("reorder_level", e.target.value)
                    }
                    placeholder="10"
                    error={errors.reorder_level}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Variant Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
              <Box className="h-5 w-5" />
              Variant Configuration
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Pieces per Box
                </label>
                <Input
                  type="number"
                  min="1"
                  value={formData.pieces_per_box}
                  onChange={(e) =>
                    handleInputChange("pieces_per_box", e.target.value)
                  }
                  placeholder="12"
                  error={errors.pieces_per_box}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  How many pieces in one box
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Pieces per Sheet
                </label>
                <Input
                  type="number"
                  min="1"
                  value={formData.pieces_per_sheet}
                  onChange={(e) =>
                    handleInputChange("pieces_per_sheet", e.target.value)
                  }
                  placeholder="1"
                  error={errors.pieces_per_sheet}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  How many pieces in one sheet
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Unit Type
                </label>
                <select
                  value={formData.unit_type}
                  onChange={(e) =>
                    handleInputChange("unit_type", e.target.value)
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="piece">Piece</option>
                  <option value="box">Box</option>
                  <option value="sheet">Sheet</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Box Price (auto-calculated)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.box_price}
                  onChange={(e) =>
                    handleInputChange("box_price", e.target.value)
                  }
                  placeholder="Auto-calculated"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Price for {formData.pieces_per_box} pieces (10% bulk discount)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Sheet Price
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.sheet_price}
                  onChange={(e) =>
                    handleInputChange("sheet_price", e.target.value)
                  }
                  placeholder="Same as selling price"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Price for {formData.pieces_per_sheet} piece(s)
                </p>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Additional Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Batch Number
                </label>
                <Input
                  value={formData.batch_number}
                  onChange={(e) =>
                    handleInputChange("batch_number", e.target.value)
                  }
                  placeholder="Batch number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Expiry Date
                </label>
                <Input
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) =>
                    handleInputChange("expiry_date", e.target.value)
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Location
                </label>
                <Input
                  value={formData.location}
                  onChange={(e) =>
                    handleInputChange("location", e.target.value)
                  }
                  placeholder="Storage location"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) =>
                  handleInputChange("is_active", e.target.checked)
                }
                className="rounded border-border"
              />
              <label htmlFor="is_active" className="text-sm text-foreground">
                Product is active
              </label>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {product ? "Update Product" : "Add Product"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
