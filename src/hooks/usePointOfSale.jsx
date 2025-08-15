import { useState, useMemo } from "react";
import * as api from "@/services/api";
import { useNotification } from "@/hooks/useNotifications";
import { useQueryClient } from "@tanstack/react-query";
import { getNotificationSettings } from "@/utils/notificationStorage"; // <-- IMPORT ADDED

export const usePointOfSale = (products, isLoading) => {
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDiscounted, setIsDiscounted] = useState(false);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingCartItem, setEditingCartItem] = useState(null);

  const { addNotification } = useNotification();
  const queryClient = useQueryClient();

  const resetSale = () => {
    setCart([]);
    setIsDiscounted(false);
    setSearchTerm("");
  };

  const handleSelectProduct = (product) => {
    const existingItem = cart.find(
      (item) => item.id === product.id && !item.selectedVariant
    );
    setEditingCartItem(existingItem || null);
    setSelectedProduct(product);
    setIsVariantModalOpen(true);
  };

  const handleAddToCart = (productToAdd) => {
    setCart((prevCart) => {
      const uniqueId = productToAdd.selectedVariant
        ? `${productToAdd.id}-${productToAdd.selectedVariant.id}`
        : productToAdd.id.toString();

      const existingItemIndex = prevCart.findIndex(
        (item) => item.uniqueId === uniqueId
      );

      if (existingItemIndex > -1) {
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex] = { ...productToAdd, uniqueId };
        return updatedCart;
      }
      return [...prevCart, { ...productToAdd, uniqueId }];
    });
  };

  const getReservedPieces = (productId, variantIdToExclude) => {
    return cart.reduce((total, item) => {
      if (item.id === productId) {
        if (
          editingCartItem &&
          item.selectedVariant?.id === variantIdToExclude
        ) {
          return total;
        }
        return (
          total + item.quantity * (item.selectedVariant?.units_per_variant || 1)
        );
      }
      return total;
    }, 0);
  };

  const updateCartQuantity = (uniqueId, newQuantity) => {
    setCart((prevCart) => {
      if (newQuantity <= 0) {
        return prevCart.filter((item) => item.uniqueId !== uniqueId);
      }
      return prevCart.map((item) =>
        item.uniqueId === uniqueId ? { ...item, quantity: newQuantity } : item
      );
    });
  };

  const { subtotal, total } = useMemo(() => {
    const sub = cart.reduce(
      (acc, item) => acc + (item.currentPrice || item.price) * item.quantity,
      0
    );
    const finalTotal = isDiscounted ? sub * 0.8 : sub;
    return { subtotal: sub, total: finalTotal };
  }, [cart, isDiscounted]);

  const filteredProducts = useMemo(() => {
    const availableProducts = (products || []).filter(
      // Defensive check
      (p) => p.quantity > 0 && p.status === "Available"
    );
    if (!searchTerm) {
      return availableProducts;
    }
    return availableProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.medicineId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const lowStockProducts = useMemo(
    () => (products || []).filter((p) => p.quantity > 0 && p.quantity <= 10),
    [products]
  );
  const outOfStockProducts = useMemo(
    () => (products || []).filter((p) => p.quantity === 0),
    [products]
  );

  const handleCheckout = async () => {
    if (cart.length === 0) {
      addNotification("Cart is empty.", "warning");
      return;
    }
    setIsProcessingCheckout(true);
    try {
      const saleData = {
        total_amount: total,
        discount_applied: isDiscounted,
      };
      const { data: newSale, error: saleError } = await api.addSale(saleData);
      if (saleError) throw saleError;

      const saleItemsData = cart.map((item) => ({
        sale_id: newSale.id,
        product_id: item.id,
        variant_id: item.selectedVariant ? item.selectedVariant.id : null,
        quantity: item.quantity,
        price_at_sale: item.currentPrice,
      }));
      const { error: itemsError } = await api.addSaleItems(saleItemsData);
      if (itemsError) throw itemsError;

      await api.addNotification({
        type: "sale",
        title: "Sale Successful",
        description: `Sale #${newSale.id} for ₱${total.toFixed(
          2
        )} was completed.`,
        path: "/point-of-sales",
      });

      // --- FIX: Check stock and create inventory notifications after sale ---
      const { lowStockThreshold } = getNotificationSettings();
      for (const item of cart) {
        const product = products.find((p) => p.id === item.id);
        if (product) {
          const piecesSold =
            item.quantity * (item.selectedVariant?.units_per_variant || 1);
          const newQuantity = Math.max(0, product.quantity - piecesSold);

          // Update product in the database
          await api.updateProduct(item.id, { quantity: newQuantity });

          // Check if a notification is needed
          if (newQuantity === 0) {
            await api.addNotification({
              type: "no_stock",
              title: "Out of Stock",
              description: `${product.name} is now out of stock.`,
              path: `/management?highlight=${product.id}`,
            });
          } else if (newQuantity <= lowStockThreshold) {
            await api.addNotification({
              type: "low_stock",
              title: "Low Stock Alert",
              description: `${product.name} has only ${newQuantity} items left.`,
              path: `/management?highlight=${product.id}`,
            });
          }
        }
      }
      // --- END FIX ---

      queryClient.invalidateQueries({ queryKey: ["products"] });

      addNotification("Sale completed successfully!", "success");
      resetSale();
    } catch (error) {
      addNotification(`Checkout failed: ${error.message}`, "error");
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  return {
    loading: isLoading || isProcessingCheckout,
    cart,
    searchTerm,
    setSearchTerm,
    isDiscounted,
    setIsDiscounted,
    isHistoryModalOpen,
    setIsHistoryModalOpen,
    isVariantModalOpen,
    setIsVariantModalOpen,
    selectedProduct,
    setSelectedProduct,
    editingCartItem,
    setEditingCartItem,
    subtotal,
    total,
    filteredProducts,
    lowStockProducts,
    outOfStockProducts,
    handleSelectProduct,
    handleAddToCart,
    getReservedPieces,
    updateCartQuantity,
    handleCheckout,
  };
};
