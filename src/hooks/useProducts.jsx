// src/hooks/useProducts.jsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "@/services/api";

export const useProducts = (addNotification) => {
  const queryClient = useQueryClient();

  const {
    data: products = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await api.getProducts();
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  const archiveProductsMutation = useMutation({
    mutationFn: (productIds) => api.archiveProducts(productIds),
    onSuccess: (data, productIds) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      addNotification(
        `${productIds.length} product(s) successfully archived.`,
        "success"
      );
      // --- FIX: This line was missing ---
      api.addNotification({
        type: "archive",
        title: "Products Archived",
        description: `${productIds.length} product(s) were archived.`,
        path: "/archived",
      });
      // --- END FIX ---
    },
    onError: (error) => {
      addNotification(`Error: ${error.message}`, "error");
    },
  });

  return {
    products,
    isLoading,
    isError,
    archiveProducts: archiveProductsMutation.mutate,
  };
};
