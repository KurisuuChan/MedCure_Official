import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/supabase/client";
import {
  getDismissedNotificationIds,
  getLowStockTimestamps,
  getNotificationSettings,
  getReadNotificationIds,
  getSystemNotifications,
  removeSystemNotification,
  setDismissedNotificationIds,
  setLowStockTimestamps,
  setReadNotificationIds,
} from "@/utils/notificationStorage";

/**
 * useNotifications centralizes fetching, generating and managing notifications
 * (mark as read, dismiss, subscribe to changes)
 */
export default function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    const { data: products, error } = await supabase
      .from("products")
      .select("id, name, quantity, expireDate, status")
      .in("status", ["Available", "Unavailable"]);

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching products for notifications:", error);
      setLoading(false);
      return;
    }

    const readIds = getReadNotificationIds();
    const dismissedIds = getDismissedNotificationIds();
    const lowStockTimestamps = getLowStockTimestamps();
    const settings = getNotificationSettings();
    let newTimestamps = { ...lowStockTimestamps };
    let timestampsUpdated = false;

    const lowStockThreshold = Number(settings.lowStockThreshold) || 0;
    const today = new Date();
    let generated = [];

    // Include stored system notifications
    const systemNotifications = getSystemNotifications();
    systemNotifications.forEach((s) => {
      generated.push({
        id: s.id,
        iconType: s.iconType || "bell",
        iconBg: s.iconBg || "bg-gray-100",
        title: s.title,
        category: s.category || "System",
        description: s.description,
        read: readIds.includes(s.id),
        path: s.path || "/",
        createdAt: new Date(s.createdAt),
      });
    });

    products.forEach((product) => {
      const baseLowStockId = `low-${product.id}`;

      // If stock recovered above threshold, clear stored episode timestamp
      if (product.quantity > lowStockThreshold && newTimestamps[baseLowStockId]) {
        delete newTimestamps[baseLowStockId];
        timestampsUpdated = true;
      }

      if (product.quantity === 0) {
        // Transitioned to out-of-stock; end any existing low-stock episode
        if (newTimestamps[baseLowStockId]) {
          delete newTimestamps[baseLowStockId];
          timestampsUpdated = true;
        }
      }

      if (product.quantity <= lowStockThreshold && product.quantity > 0) {
        let timestamp = newTimestamps[baseLowStockId];
        if (!timestamp) {
          timestamp = new Date().toISOString();
          newTimestamps[baseLowStockId] = timestamp;
          timestampsUpdated = true;
        }

        // Use episode-based ID so dismissing a past alert doesn't suppress future ones
        const lowStockId = `${baseLowStockId}-${timestamp}`;

        generated.push({
          id: lowStockId,
          iconType: "lowStock",
          iconBg: "bg-yellow-100",
          title: "Low Stock Warning",
          category: "Low Stock",
          description: `${product.name} has only ${product.quantity} items left.`,
          read: readIds.includes(lowStockId),
          path: `/management?highlight=${product.id}`,
          createdAt: new Date(timestamp),
        });
      }

      const noStockId = `no-stock-${product.id}`;
      if (product.quantity === 0) {
        generated.push({
          id: noStockId,
          iconType: "noStock",
          iconBg: "bg-red-100",
          title: "Out of Stock",
          category: "No Stock",
          description: `${product.name} is out of stock.`,
          read: readIds.includes(noStockId),
          path: `/management?highlight=${product.id}`,
          createdAt: new Date(),
        });
      }

      const expiredId = `expired-${product.id}`;
      const expiryDate = new Date(product.expireDate);
      if (expiryDate < today) {
        generated.push({
          id: expiredId,
          iconType: "expired",
          iconBg: "bg-red-100",
          title: "Expired Medicine Alert",
          category: "Expired",
          description: `${product.name} (ID: ${product.id}) has expired.`,
          read: readIds.includes(expiredId),
          path: `/management?highlight=${product.id}`,
          createdAt: expiryDate,
        });
      }

      // Expiring soon (configurable)
      if (settings.enableExpiringSoon && product.expireDate) {
        const diffMs = expiryDate - today;
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays > 0 && diffDays <= Number(settings.expiringSoonDays)) {
          const expSoonId = `exp-soon-${product.id}`;
          generated.push({
            id: expSoonId,
            iconType: "expiringSoon",
            iconBg: "bg-orange-100",
            title: "Expiring Soon",
            category: "Expiring Soon",
            description: `${product.name} expires in ${diffDays} day(s).`,
            read: readIds.includes(expSoonId),
            path: `/management?highlight=${product.id}`,
            createdAt: expiryDate,
          });
        }
      }
    });

    if (timestampsUpdated) {
      setLowStockTimestamps(newTimestamps);
    }

    generated = generated.filter((n) => !dismissedIds.includes(n.id));
    generated.sort((a, b) => b.createdAt - a.createdAt);

    setNotifications(generated);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel("products-notifications")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        fetchNotifications
      )
      .subscribe();

    const handleStorageChange = () => {
      fetchNotifications();
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [fetchNotifications]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const categories = useMemo(
    () => ["All", "Low Stock", "No Stock", "Expired", "Expiring Soon", "System"],
    []
  );

  const categoryCounts = useMemo(() => {
    return notifications.reduce(
      (acc, n) => {
        acc.All += 1;
        acc[n.category] = (acc[n.category] || 0) + 1;
        return acc;
      },
      { All: 0 }
    );
  }, [notifications]);

  const markAsRead = useCallback(
    (notificationId) => {
      const readIds = getReadNotificationIds();
      if (!readIds.includes(notificationId)) {
        setReadNotificationIds([...readIds, notificationId]);
      }
      const updated = notifications.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      );
      setNotifications(updated);
      const target = updated.find((x) => x.id === notificationId);
      if (target && target.category === "System") {
        // Auto-dismiss system notifications after marking as read
        dismiss(notificationId);
      }
    },
    [notifications]
  );

  const markAllAsRead = useCallback(() => {
    const allIds = notifications.map((n) => n.id);
    const readIds = getReadNotificationIds();
    const newReadIds = [...new Set([...readIds, ...allIds])];
    setReadNotificationIds(newReadIds);
    setNotifications(notifications.map((n) => ({ ...n, read: true })));

    // Dismiss all system notifications and remove from storage
    const systemOnly = notifications.filter((n) => n.category === "System");
    const dismissed = getDismissedNotificationIds();
    const toDismiss = systemOnly.map((n) => n.id);
    setDismissedNotificationIds([...new Set([...dismissed, ...toDismiss])]);
    toDismiss.forEach((id) => removeSystemNotification(id));
  }, [notifications]);

  const dismiss = useCallback(
    (notificationId) => {
      const dismissed = getDismissedNotificationIds();
      setDismissedNotificationIds([...new Set([...dismissed, notificationId])]);
      const target = notifications.find((n) => n.id === notificationId);
      if (target && target.category === "System") {
        removeSystemNotification(notificationId);
      }
      setNotifications(notifications.filter((n) => n.id !== notificationId));
    },
    [notifications]
  );

  return {
    notifications,
    loading,
    unreadCount,
    categories,
    categoryCounts,
    refresh: fetchNotifications,
    markAsRead,
    markAllAsRead,
    dismiss,
  };
}


