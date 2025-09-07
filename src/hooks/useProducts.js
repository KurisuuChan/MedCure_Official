import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("products")
        .select(
          `
          *,
          categories (
            id,
            name
          )
        `
        )
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      // Add health status to each product
      const productsWithHealth = data.map((product) => ({
        ...product,
        health_status: getProductHealthStatus(
          product.stock_quantity,
          product.min_stock_level,
          product.expiry_date
        ),
      }));

      setProducts(productsWithHealth);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getProductHealthStatus = (stockQty, minStock, expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry <= 0) return "expired";
    if (daysUntilExpiry <= 30) return "expiring_soon";
    if (stockQty <= minStock) return "low_stock";
    return "good";
  };

  const getLowStockProducts = () => {
    return products.filter((p) => p.health_status === "low_stock");
  };

  const getExpiredProducts = () => {
    return products.filter((p) => p.health_status === "expired");
  };

  const getExpiringSoonProducts = () => {
    return products.filter((p) => p.health_status === "expiring_soon");
  };

  useEffect(() => {
    fetchProducts();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    products,
    loading,
    error,
    refetch: fetchProducts,
    getLowStockProducts,
    getExpiredProducts,
    getExpiringSoonProducts,
  };
};
