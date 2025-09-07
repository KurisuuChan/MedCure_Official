import React, { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  TrendingDown,
  Package,
  Calendar,
  User,
  Plus,
  Minus,
  Edit3,
  RefreshCw,
  Filter,
  Download,
  Box,
  FileText,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { LoadingSpinner } from "./ui/LoadingSpinner";

export const StockMovementManager = ({ productId = null, onClose = null }) => {
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    product_id: productId || "",
    movement_type: "all",
    date_from: "",
    date_to: "",
  });
  const [showAddStock, setShowAddStock] = useState(false);
  const [addStockForm, setAddStockForm] = useState({
    product_id: productId || "",
    quantity: "",
    variant: "piece",
    notes: "",
    movement_type: "in",
  });

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("stock_movements")
        .select(
          `
          *,
          products(id, name, sku, pieces_per_box, pieces_per_sheet),
          user_profiles(email, first_name, last_name)
        `
        )
        .order("created_at", { ascending: false })
        .limit(100);

      // Apply filters
      if (filters.product_id) {
        query = query.eq("product_id", filters.product_id);
      }
      if (filters.movement_type !== "all") {
        query = query.eq("movement_type", filters.movement_type);
      }
      if (filters.date_from) {
        query = query.gte("created_at", filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte("created_at", filters.date_to + "T23:59:59");
      }

      const { data, error } = await query;

      if (error) throw error;
      setMovements(data || []);
    } catch (error) {
      console.error("Error fetching stock movements:", error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(
          "id, name, sku, stock_quantity, pieces_per_box, pieces_per_sheet"
        )
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  useEffect(() => {
    fetchMovements();
    fetchProducts();
  }, [filters, fetchMovements]);

  const handleAddStock = async (e) => {
    e.preventDefault();

    if (!addStockForm.product_id || !addStockForm.quantity) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const { data, error } = await supabase.rpc("add_stock", {
        p_product_id: addStockForm.product_id,
        p_quantity: parseInt(addStockForm.quantity),
        p_variant: addStockForm.variant,
        p_notes: addStockForm.notes || "Manual stock adjustment",
      });

      if (error) throw error;

      if (data.success) {
        alert("Stock added successfully!");
        setShowAddStock(false);
        setAddStockForm({
          product_id: productId || "",
          quantity: "",
          variant: "piece",
          notes: "",
          movement_type: "in",
        });
        fetchMovements();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error adding stock:", error);
      alert(`Error adding stock: ${error.message}`);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getVariantDisplay = (movement) => {
    if (!movement.notes) return "";

    if (movement.notes.includes("(box)")) return "Box";
    if (movement.notes.includes("(sheet)")) return "Sheet";
    return "Piece";
  };

  const exportMovements = () => {
    const csvData = movements.map((movement) => ({
      Date: formatDate(movement.created_at),
      Product: movement.products?.name || "Unknown",
      SKU: movement.products?.sku || "",
      Type: movement.movement_type === "in" ? "Stock In" : "Stock Out",
      Quantity: movement.quantity,
      Variant: getVariantDisplay(movement),
      Notes: movement.notes || "",
      User: movement.user_profiles?.email || "System",
    }));

    const csv = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map((row) =>
        Object.values(row)
          .map((val) => `"${val}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stock-movements-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Stock Movement</h2>
          <p className="text-muted-foreground">
            Track all inventory movements with variant support
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
          <Button onClick={() => setShowAddStock(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Stock
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Product</label>
            <select
              value={filters.product_id}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, product_id: e.target.value }))
              }
              className="w-full px-3 py-2 bg-background border border-border rounded-md"
            >
              <option value="">All Products</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.sku})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Movement Type
            </label>
            <select
              value={filters.movement_type}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  movement_type: e.target.value,
                }))
              }
              className="w-full px-3 py-2 bg-background border border-border rounded-md"
            >
              <option value="all">All Types</option>
              <option value="in">Stock In</option>
              <option value="out">Stock Out</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">From Date</label>
            <Input
              type="date"
              value={filters.date_from}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, date_from: e.target.value }))
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">To Date</label>
            <Input
              type="date"
              value={filters.date_to}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, date_to: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={fetchMovements} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportMovements} size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </Card>

      {/* Add Stock Modal */}
      {showAddStock && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Add Stock</h3>

              <form onSubmit={handleAddStock} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Product *
                  </label>
                  <select
                    value={addStockForm.product_id}
                    onChange={(e) =>
                      setAddStockForm((prev) => ({
                        ...prev,
                        product_id: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-md"
                    required
                  >
                    <option value="">Select Product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.sku})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Quantity *
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={addStockForm.quantity}
                      onChange={(e) =>
                        setAddStockForm((prev) => ({
                          ...prev,
                          quantity: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Variant
                    </label>
                    <select
                      value={addStockForm.variant}
                      onChange={(e) =>
                        setAddStockForm((prev) => ({
                          ...prev,
                          variant: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 bg-background border border-border rounded-md"
                    >
                      <option value="piece">Piece</option>
                      <option value="box">Box</option>
                      <option value="sheet">Sheet</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Notes
                  </label>
                  <Input
                    value={addStockForm.notes}
                    onChange={(e) =>
                      setAddStockForm((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    placeholder="Stock adjustment reason"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddStock(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Stock
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}

      {/* Movements Table */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Movements</h3>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : movements.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No stock movements found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Date</th>
                    <th className="text-left p-4 font-medium">Product</th>
                    <th className="text-left p-4 font-medium">Type</th>
                    <th className="text-left p-4 font-medium">Quantity</th>
                    <th className="text-left p-4 font-medium">Variant</th>
                    <th className="text-left p-4 font-medium">Notes</th>
                    <th className="text-left p-4 font-medium">User</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((movement) => (
                    <tr
                      key={movement.id}
                      className="border-b hover:bg-muted/50"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {formatDate(movement.created_at)}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium">
                            {movement.products?.name || "Unknown Product"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {movement.products?.sku}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge
                          variant={
                            movement.movement_type === "in"
                              ? "success"
                              : "secondary"
                          }
                          className="flex items-center gap-1 w-fit"
                        >
                          {movement.movement_type === "in" ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {movement.movement_type === "in"
                            ? "Stock In"
                            : "Stock Out"}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <span className="font-medium">{movement.quantity}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          {getVariantDisplay(movement) === "Box" && (
                            <Box className="h-3 w-3 text-muted-foreground" />
                          )}
                          {getVariantDisplay(movement) === "Sheet" && (
                            <FileText className="h-3 w-3 text-muted-foreground" />
                          )}
                          {getVariantDisplay(movement) === "Piece" && (
                            <Package className="h-3 w-3 text-muted-foreground" />
                          )}
                          <span className="text-sm">
                            {getVariantDisplay(movement) || "Piece"}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-muted-foreground">
                          {movement.notes || "-"}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {movement.user_profiles?.first_name ||
                              movement.user_profiles?.email ||
                              "System"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
