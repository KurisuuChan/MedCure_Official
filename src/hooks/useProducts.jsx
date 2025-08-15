import { useQuery } from "@tanstack/react-query";
import { productsApi } from "@/services/api/productsApi";

const FIVE_MINUTES = 5 * 60 * 1000;

export const useProducts = () => {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await productsApi.list();
      if (error) throw error;
      return data;
    },
    staleTime: FIVE_MINUTES,
  });
};

export const useArchivedProducts = () => {
  return useQuery({
    queryKey: ["archivedProducts"],
    queryFn: async () => {
      const { data, error } = await productsApi.listArchived();
      if (error) throw error;
      return data;
    },
    staleTime: FIVE_MINUTES,
  });
};
