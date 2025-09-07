import { useState, useEffect } from "react";
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  AlertTriangle,
  Calendar,
  Barcode,
  TrendingUp,
  TrendingDown,
  RefreshCw,
} from "lucide-react";
import { useProducts } from "../hooks/useProducts";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { ProductModal } from "../components/ProductModal";

export const Management = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const { products, loading, refetch } = useProducts();
  const { user } = useAuth();

  // Check permissions
  const canManageProducts =
    user?.role === "admin" || user?.role === "pharmacist";

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-PH");
  };

  const getHealthStatusInfo = (product) => {
    const today = new Date();
    const expiry = new Date(product.expiry_date);
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry <= 0) {
      return { status: "expired", variant: "destructive", label: "Expired" };
    } else if (daysUntilExpiry <= 30) {
      return {
        status: "expiring_soon",
        variant: "warning",
        label: "Expiring Soon",
      };
    } else if (product.stock_quantity <= product.min_stock_level) {
      return { status: "low_stock", variant: "warning", label: "Low Stock" };
    }
    return { status: "good", variant: "success", label: "Good" };
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.generic_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.batch_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand?.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterStatus === "all") return matchesSearch;

    const healthInfo = getHealthStatusInfo(product);
    return matchesSearch && healthInfo.status === filterStatus;
  });

  const deleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);

      if (error) throw error;

      alert("Product deleted successfully");
      refetch();
    } catch (err) {
      console.error("Error deleting product:", err);
      alert("Error deleting product: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!canManageProducts) {
    return (
      <div className="space-y-6">
        <div className="text-center p-8">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Access Restricted
          </h2>
          <p className="text-muted-foreground">
            You don't have permission to manage inventory. Contact your
            administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Inventory Management
          </h1>
          <p className="text-muted-foreground">
            Manage your pharmacy inventory and products
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={refetch} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Products
              </p>
              <p className="text-2xl font-bold text-foreground">
                {products.length}
              </p>
            </div>
            <Package className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Low Stock
              </p>
              <p className="text-2xl font-bold text-warning">
                {
                  products.filter((p) => p.stock_quantity <= p.min_stock_level)
                    .length
                }
              </p>
            </div>
            <TrendingDown className="h-8 w-8 text-warning" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Expired
              </p>
              <p className="text-2xl font-bold text-destructive">
                {
                  products.filter((p) => new Date(p.expiry_date) <= new Date())
                    .length
                }
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Value
              </p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(
                  products.reduce(
                    (sum, p) => sum + p.selling_price * p.stock_quantity,
                    0
                  )
                )}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-success" />
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
          >
            <option value="all">All Products</option>
            <option value="good">Good Condition</option>
            <option value="low_stock">Low Stock</option>
            <option value="expiring_soon">Expiring Soon</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium text-foreground">
                  Product
                </th>
                <th className="text-left p-4 font-medium text-foreground">
                  Category
                </th>
                <th className="text-left p-4 font-medium text-foreground">
                  Stock
                </th>
                <th className="text-left p-4 font-medium text-foreground">
                  Price
                </th>
                <th className="text-left p-4 font-medium text-foreground">
                  Expiry
                </th>
                <th className="text-left p-4 font-medium text-foreground">
                  Status
                </th>
                <th className="text-left p-4 font-medium text-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const healthInfo = getHealthStatusInfo(product);
                return (
                  <tr
                    key={product.id}
                    className="border-t border-border hover:bg-muted/30"
                  >
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-foreground">
                          {product.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {product.generic_name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Barcode className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {product.batch_number}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-foreground">
                        {product.categories?.name || "Uncategorized"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-foreground">
                          {product.stock_quantity}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Min: {product.min_stock_level}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-foreground">
                          {formatCurrency(product.selling_price)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Cost: {formatCurrency(product.cost_price)}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm text-foreground">
                          {formatDate(product.expiry_date)}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant={healthInfo.variant} size="sm">
                        {healthInfo.label}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingProduct(product)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        {user?.role === "admin" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteProduct(product.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchTerm || filterStatus !== "all"
                ? "No products match your search criteria"
                : "No products found"}
            </p>
          </div>
        )}
      </Card>

      {/* Product Modal */}
      <ProductModal
        isOpen={showAddModal || !!editingProduct}
        onClose={() => {
          setShowAddModal(false);
          setEditingProduct(null);
        }}
        product={editingProduct}
        categories={categories}
        onSave={() => {
          setShowAddModal(false);
          setEditingProduct(null);
          refetch();
        }}
      />
    </div>
  );
};
