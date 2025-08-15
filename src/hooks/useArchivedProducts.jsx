// src/hooks/useArchivedProducts.jsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "@/services/api";

export const useArchivedProducts = (addNotification) => {
  const queryClient = useQueryClient();

  const {
    data: archivedProducts = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["archivedProducts"],
    queryFn: async () => {
      const { data, error } = await api.getArchivedProducts();
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  const unarchiveMutation = useMutation({
    mutationFn: (productIds) =>
      api.supabase
        .from("products")
        .update({ status: "Available" })
        .in("id", productIds),
    onSuccess: (data, productIds) => {
      queryClient.invalidateQueries({ queryKey: ["archivedProducts"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });

      addNotification(
        `${productIds.length} product(s) successfully unarchived.`,
        "success"
      );
      // --- FIX: This line was missing ---
      api.addNotification({
        type: "unarchive",
        title: "Products Restored",
        description: `${productIds.length} product(s) were restored from the archive.`,
        path: "/management",
      });
      // --- END FIX ---
    },
    onError: (error) => {
      addNotification(`Error: ${error.message}`, "error");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (productIds) =>
      api.supabase.from("products").delete().in("id", productIds),
    onSuccess: (data, productIds) => {
      queryClient.invalidateQueries({ queryKey: ["archivedProducts"] });
      addNotification(
        `${productIds.length} product(s) permanently deleted.`,
        "success"
      );
      // --- FIX: This line was missing ---
      api.addNotification({
        type: "delete",
        title: "Products Deleted",
        description: `${productIds.length} product(s) were permanently deleted.`,
        path: "/archived",
      });
      // --- END FIX ---
    },
    onError: (error) => {
      addNotification(`Error: ${error.message}`, "error");
    },
  });

  return {
    archivedProducts,
    isLoading,
    isError,
    unarchiveProducts: unarchiveMutation.mutate,
    deleteProductsPermanently: deleteMutation.mutate,
  };
};
