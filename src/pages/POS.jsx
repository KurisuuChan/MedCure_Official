import { useState } from "react";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Smartphone,
  Banknote,
  Receipt,
  User,
  Phone,
  Package,
  Box,
  FileText,
} from "lucide-react";
import { useProducts } from "../hooks/useProducts";
import { useSales } from "../hooks/useSales";
import { useCartStore } from "../store/cartStore";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";

export const POS = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);
  const { products, loading: productsLoading } = useProducts();
  const { processSale, loading: saleLoading } = useSales();

  const {
    items,
    customer,
    payment,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    setCustomer,
    setPayment,
    getSubtotal,
    getTaxAmount,
    getTotal,
    getChange,
    canProcessSale,
  } = useCartStore();

  // Filter products based on search
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.generic_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount || 0);
  };

  // Get variant pricing and availability
  const getVariantInfo = (product, variant = "piece") => {
    switch (variant) {
      case "box":
        return {
          price:
            product.box_price ||
            product.selling_price * (product.pieces_per_box || 12),
          available: Math.floor(
            product.stock_quantity / (product.pieces_per_box || 12)
          ),
          unit: "box",
          piecesPerUnit: product.pieces_per_box || 12,
        };
      case "sheet":
        return {
          price: product.sheet_price || product.selling_price,
          available: Math.floor(
            product.stock_quantity / (product.pieces_per_sheet || 1)
          ),
          unit: "sheet",
          piecesPerUnit: product.pieces_per_sheet || 1,
        };
      default: // piece
        return {
          price: product.selling_price,
          available: product.stock_quantity,
          unit: "piece",
          piecesPerUnit: 1,
        };
    }
  };

  const handleAddToCart = (product, variant = "piece") => {
    const variantInfo = getVariantInfo(product, variant);

    if (variantInfo.available <= 0) {
      alert(`Product is out of stock for ${variant}`);
      return;
    }

    addItem(
      {
        ...product,
        variant,
        variantPrice: variantInfo.price,
        piecesPerUnit: variantInfo.piecesPerUnit,
        availableUnits: variantInfo.available,
      },
      1
    );
  };

  const handleQuantityChange = (item, newQuantity) => {
    const variantInfo = getVariantInfo(item, item.variant);
    if (newQuantity > variantInfo.available) {
      alert(`Only ${variantInfo.available} ${item.variant}s available`);
      return;
    }
    updateQuantity(item.id, item.variant, newQuantity);
  };

  const handleProcessSale = async () => {
    if (!canProcessSale()) {
      alert("Please check payment amount and stock availability");
      return;
    }

    // Convert cart items to sale format with variant info
    const saleItems = items.map((item) => ({
      product_id: item.id,
      quantity: item.quantity,
      variant: item.variant || "piece",
    }));

    const result = await processSale(
      saleItems,
      customer.name || "Walk-in Customer",
      payment.method
    );

    if (result.success) {
      alert(`Sale processed successfully! Sale #${result.sale_number}`);
      clearCart();
      setShowCheckout(false);
    } else {
      alert(`Error processing sale: ${result.error}`);
    }
  };

  if (productsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Point of Sale</h1>
          <p className="text-muted-foreground">
            Process sales with variant support (piece, box, sheet)
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="px-4 py-2">
            <ShoppingCart className="h-4 w-4 mr-2" />
            {items.length} items
          </Badge>
          <Button
            onClick={() => setShowCheckout(!showCheckout)}
            disabled={items.length === 0}
            className="relative"
          >
            <Receipt className="h-4 w-4 mr-2" />
            Checkout
            {items.length > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs"
              >
                {items.length}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Section */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search products by name, SKU, or generic name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto">
            {filteredProducts.length === 0 && !productsLoading ? (
              <div className="col-span-full text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm
                    ? "No products match your search"
                    : "No products available"}
                </p>
              </div>
            ) : (
              filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className="p-4 hover:shadow-md transition-shadow"
                >
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-foreground line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {product.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        SKU: {product.sku}
                      </p>
                    </div>

                    {/* Variant Options */}
                    <div className="space-y-2">
                      {/* Piece Option */}
                      <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Piece</p>
                            <p className="text-lg font-bold text-foreground">
                              {formatCurrency(product.selling_price)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {product.stock_quantity} available
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleAddToCart(product, "piece")}
                          disabled={product.stock_quantity <= 0}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Box Option */}
                      {(product.pieces_per_box || 12) > 1 && (
                        <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <div className="flex items-center gap-2">
                            <Box className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">
                                Box ({product.pieces_per_box || 12} pcs)
                              </p>
                              <p className="text-lg font-bold text-foreground">
                                {formatCurrency(
                                  getVariantInfo(product, "box").price
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {getVariantInfo(product, "box").available}{" "}
                                available
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleAddToCart(product, "box")}
                            disabled={
                              getVariantInfo(product, "box").available <= 0
                            }
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      )}

                      {/* Sheet Option */}
                      {(product.pieces_per_sheet || 1) > 1 && (
                        <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">
                                Sheet ({product.pieces_per_sheet || 1} pcs)
                              </p>
                              <p className="text-lg font-bold text-foreground">
                                {formatCurrency(
                                  getVariantInfo(product, "sheet").price
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {getVariantInfo(product, "sheet").available}{" "}
                                available
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleAddToCart(product, "sheet")}
                            disabled={
                              getVariantInfo(product, "sheet").available <= 0
                            }
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Cart Section */}
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                Shopping Cart
              </h3>
              {items.length > 0 && (
                <Button variant="outline" size="sm" onClick={clearCart}>
                  Clear All
                </Button>
              )}
            </div>

            {items.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Your cart is empty</p>
                <p className="text-sm text-muted-foreground">
                  Add products to start a sale
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {items.map((item) => (
                  <div
                    key={`${item.id}-${item.variant}`}
                    className="flex items-center gap-3 p-3 border rounded"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground line-clamp-1">
                        {item.name}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {item.variant} -{" "}
                        {formatCurrency(
                          item.variantPrice || item.selling_price
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleQuantityChange(item, item.quantity - 1)
                        }
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm">
                        {item.quantity}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleQuantityChange(item, item.quantity + 1)
                        }
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeItem(item.id, item.variant)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {items.length > 0 && (
              <div className="mt-4 pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(getSubtotal())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax (12%):</span>
                  <span>{formatCurrency(getTaxAmount())}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span>{formatCurrency(getTotal())}</span>
                </div>
              </div>
            )}
          </Card>

          {/* Checkout Section */}
          {showCheckout && items.length > 0 && (
            <Card className="p-4">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Checkout
              </h3>

              <div className="space-y-4">
                {/* Customer Information */}
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">Customer</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Customer name (optional)"
                        value={customer.name || ""}
                        onChange={(e) =>
                          setCustomer({ ...customer, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Phone number (optional)"
                        value={customer.phone || ""}
                        onChange={(e) =>
                          setCustomer({ ...customer, phone: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">Payment</h4>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={
                        payment.method === "cash" ? "default" : "outline"
                      }
                      onClick={() => setPayment({ ...payment, method: "cash" })}
                      className="flex items-center gap-2"
                    >
                      <Banknote className="h-4 w-4" />
                      Cash
                    </Button>
                    <Button
                      variant={
                        payment.method === "gcash" ? "default" : "outline"
                      }
                      onClick={() =>
                        setPayment({ ...payment, method: "gcash" })
                      }
                      className="flex items-center gap-2"
                    >
                      <Smartphone className="h-4 w-4" />
                      GCash
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Input
                      type="number"
                      placeholder="Amount paid"
                      value={payment.amountPaid || ""}
                      onChange={(e) =>
                        setPayment({
                          ...payment,
                          amountPaid: parseFloat(e.target.value) || 0,
                        })
                      }
                      min="0"
                      step="0.01"
                    />

                    {payment.amountPaid > 0 && (
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span>Amount Paid:</span>
                          <span>{formatCurrency(payment.amountPaid)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total:</span>
                          <span>{formatCurrency(getTotal())}</span>
                        </div>
                        <div className="flex justify-between font-semibold">
                          <span>Change:</span>
                          <span
                            className={
                              getChange() >= 0
                                ? "text-success"
                                : "text-destructive"
                            }
                          >
                            {formatCurrency(getChange())}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Process Sale Button */}
                <Button
                  onClick={handleProcessSale}
                  disabled={!canProcessSale() || saleLoading}
                  className="w-full"
                >
                  {saleLoading ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <Receipt className="h-4 w-4 mr-2" />
                  )}
                  Process Sale
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
