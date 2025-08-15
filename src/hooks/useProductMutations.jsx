import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "@/services/api";
import { useNotification } from "@/hooks/useNotifications";

/**
 * Custom hook for handling product mutations (archive, unarchive, delete).
 * Provides consistent notification and query invalidation logic.
 * @param {object} options - Optional callbacks.
 * @param {function} options.onSuccess - Callback to run on successful mutation.
 */
export const useProductMutations = (options = {}) => {
  const queryClient = useQueryClient();
  const { addNotification } = useNotification();
  const { onSuccess: onSuccessCallback } = options;

  const handleSuccess = (productIds, action) => {
    addNotification(
      `${productIds.length} product(s) successfully ${action}.`,
      "success"
    );
    // Invalidate queries to refetch product lists
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["archivedProducts"] });

    // Defensive check for the optional callback
    if (onSuccessCallback) {
      onSuccessCallback();
    }
  };

  const handleError = (error) => {
    addNotification(`Error: ${error.message}`, "error");
  };

  const archiveProductsMutation = useMutation({
    mutationFn: (productIds) => api.archiveProducts(productIds),
    onSuccess: (data, productIds) => {
      handleSuccess(productIds, "archived");
      api.addNotification({
        type: "archive",
        title: "Products Archived",
        description: `${productIds.length} product(s) were archived.`,
        path: "/archived",
      });
    },
    onError: handleError,
  });

  const unarchiveProductsMutation = useMutation({
    mutationFn: (productIds) =>
      api.supabase
        .from("products")
        .update({ status: "Available" })
        .in("id", productIds),
    onSuccess: (data, productIds) => {
      handleSuccess(productIds, "unarchived");
      api.addNotification({
        type: "unarchive",
        title: "Products Restored",
        description: `${productIds.length} product(s) were restored from the archive.`,
        path: "/management",
      });
    },
    onError: handleError,
  });

  const deleteProductsPermanentlyMutation = useMutation({
    mutationFn: (productIds) =>
      api.supabase.from("products").delete().in("id", productIds),
    onSuccess: (data, productIds) => {
      handleSuccess(productIds, "deleted");
      api.addNotification({
        type: "delete",
        title: "Products Deleted",
        description: `${productIds.length} product(s) were permanently deleted.`,
        path: "/archived",
      });
    },
    onError: handleError,
  });

  return {
    archiveProducts: archiveProductsMutation.mutate,
    unarchiveProducts: unarchiveProductsMutation.mutate,
    deleteProductsPermanently: deleteProductsPermanentlyMutation.mutate,
  };
};
