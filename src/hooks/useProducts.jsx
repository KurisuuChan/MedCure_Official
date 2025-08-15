import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "@/services/api";

export const useProducts = (addNotification) => {
  const queryClient = useQueryClient();

  // Query to fetch all non-archived products
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

  // Mutation for archiving products
  const archiveProductsMutation = useMutation({
    mutationFn: (productIds) => api.archiveProducts(productIds),
    onSuccess: (data, productIds) => {
      // When the mutation is successful, invalidate the 'products' query
      // This will trigger a re-fetch and update the UI automatically
      queryClient.invalidateQueries({ queryKey: ["products"] });
      addNotification(
        `${productIds.length} product(s) successfully archived.`,
        "success"
      );
      api.addNotification({
        type: "archive",
        title: "Products Archived",
        description: `${productIds.length} product(s) were archived.`,
        path: "/archived",
      });
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
