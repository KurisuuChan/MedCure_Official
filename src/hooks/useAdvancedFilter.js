import { useState, useEffect, useMemo } from "react";

export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export const useAdvancedFilter = (items, searchTerm, filters = {}) => {
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const filteredItems = useMemo(() => {
    if (!items) return [];

    return items.filter((item) => {
      // Search term filtering
      if (debouncedSearchTerm) {
        const searchLower = debouncedSearchTerm.toLowerCase();
        const searchableFields = [
          item.name,
          item.generic_name,
          item.batch_number,
          item.brand,
          item.categories?.name,
        ].filter(Boolean);

        const matchesSearch = searchableFields.some((field) =>
          field.toLowerCase().includes(searchLower)
        );

        if (!matchesSearch) return false;
      }

      // Additional filters
      if (filters.category && filters.category !== "all") {
        if (item.category_id !== filters.category) return false;
      }

      if (filters.status && filters.status !== "all") {
        const today = new Date();
        const expiry = new Date(item.expiry_date);
        const daysUntilExpiry = Math.ceil(
          (expiry - today) / (1000 * 60 * 60 * 24)
        );

        let itemStatus = "good";
        if (daysUntilExpiry <= 0) {
          itemStatus = "expired";
        } else if (daysUntilExpiry <= 30) {
          itemStatus = "expiring_soon";
        } else if (item.stock_quantity <= item.min_stock_level) {
          itemStatus = "low_stock";
        }

        if (itemStatus !== filters.status) return false;
      }

      if (filters.priceRange) {
        const { min, max } = filters.priceRange;
        if (min !== undefined && item.selling_price < min) return false;
        if (max !== undefined && item.selling_price > max) return false;
      }

      if (filters.stockRange) {
        const { min, max } = filters.stockRange;
        if (min !== undefined && item.stock_quantity < min) return false;
        if (max !== undefined && item.stock_quantity > max) return false;
      }

      return true;
    });
  }, [items, debouncedSearchTerm, filters]);

  return filteredItems;
};
