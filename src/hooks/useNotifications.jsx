import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/supabase/client";
import { useEffect, useContext, useMemo } from "react";
import { NotificationContext } from "@/context/NotificationContext";
import {
  NOTIFICATION_CONFIG,
  getNotificationConfig,
} from "@/utils/notifications";

// This hook handles fetching and managing notification data
export function useNotificationHistory() {
  const queryClient = useQueryClient();

  const { data: rawNotifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  // Process notifications to add a consistent category label
  const notifications = useMemo(() => {
    return rawNotifications.map((n) => ({
      ...n,
      category: getNotificationConfig(n.type).label,
    }));
  }, [rawNotifications]);

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId) =>
      supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () =>
      supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("is_read", false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const dismissNotificationMutation = useMutation({
    mutationFn: (notificationId) =>
      supabase.from("notifications").delete().eq("id", notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // Real-time subscription for new notifications
  useEffect(() => {
    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Generate categories dynamically for the tabs
  const { categories, categoryCounts } = useMemo(() => {
    const counts = { All: notifications.length };
    const categorySet = new Set(["All"]);

    notifications.forEach((n) => {
      const categoryLabel = getNotificationConfig(n.type).label;
      counts[categoryLabel] = (counts[categoryLabel] || 0) + 1;
      categorySet.add(categoryLabel);
    });

    return { categories: Array.from(categorySet), categoryCounts: counts };
  }, [notifications]);

  const groupedByDate = useMemo(() => {
    const groups = {};
    notifications.forEach((n) => {
      const dateKey = new Date(n.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(n);
    });
    return Object.entries(groups).map(([date, items]) => ({ date, items }));
  }, [notifications]);

  return {
    notifications,
    loading: isLoading,
    unreadCount,
    categories,
    categoryCounts,
    groupedByDate,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    dismiss: dismissNotificationMutation.mutate,
  };
}

// Hook for accessing the notification context (for toasts)
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};
