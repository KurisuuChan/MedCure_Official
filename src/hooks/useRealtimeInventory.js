import { useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useToast } from "../contexts/ToastContext";

export const useRealtimeInventory = (onDataChange) => {
  const subscriptionRef = useRef(null);
  const toast = useToast();

  useEffect(() => {
    // Set up real-time subscription for products table
    subscriptionRef.current = supabase
      .channel("products_changes")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all events (INSERT, UPDATE, DELETE)
          schema: "public",
          table: "products",
        },
        (payload) => {
          console.log("Real-time product change detected:", payload);

          // Handle different types of changes
          switch (payload.eventType) {
            case "INSERT":
              toast.success(`New product added: ${payload.new.name}`, {
                title: "Inventory Update",
              });
              break;
            case "UPDATE":
              // Check if stock quantity changed significantly
              if (payload.old.stock_quantity !== payload.new.stock_quantity) {
                const difference =
                  payload.new.stock_quantity - payload.old.stock_quantity;
                if (Math.abs(difference) > 0) {
                  toast.info(
                    `Stock updated for ${payload.new.name}: ${
                      difference > 0 ? "+" : ""
                    }${difference}`,
                    { title: "Stock Change" }
                  );
                }
              }

              // Check for low stock alerts
              if (
                payload.new.stock_quantity <= payload.new.min_stock_level &&
                payload.old.stock_quantity > payload.old.min_stock_level
              ) {
                toast.warning(
                  `Low stock alert: ${payload.new.name} (${payload.new.stock_quantity} remaining)`,
                  { title: "Low Stock Alert", duration: 8000 }
                );
              }
              break;
            case "DELETE":
              toast.info(`Product removed: ${payload.old.name}`, {
                title: "Inventory Update",
              });
              break;
          }

          // Trigger data refresh callback
          if (onDataChange) {
            onDataChange(payload);
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [onDataChange, toast]);

  // Return function to manually unsubscribe
  const unsubscribe = () => {
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }
  };

  return { unsubscribe };
};
