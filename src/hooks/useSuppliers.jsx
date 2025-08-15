import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "@/services/api";
import { useNotification } from "@/hooks/useNotifications.jsx";

export const useSuppliers = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useNotification();

  const {
    data: suppliers = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["suppliers"],
    queryFn: api.getSuppliers,
  });

  const createMutation = useMutation({
    mutationFn: api.addSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      addNotification("Supplier added successfully!", "success");
    },
    onError: (error) => addNotification(`Error: ${error.message}`, "error"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.updateSupplier(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      addNotification("Supplier updated successfully!", "success");
    },
    onError: (error) => addNotification(`Error: ${error.message}`, "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      addNotification("Supplier deleted successfully.", "success");
    },
    onError: (error) => addNotification(`Error: ${error.message}`, "error"),
  });

  return {
    suppliers,
    isLoading,
    isError,
    addSupplier: createMutation.mutate,
    updateSupplier: updateMutation.mutate,
    deleteSupplier: deleteMutation.mutate,
  };
};
