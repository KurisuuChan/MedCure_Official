import { supabase, handleSupabaseQuery } from "./supabaseClient";

export const notificationsApi = {
  create: (notificationData) =>
    handleSupabaseQuery(
      supabase.from("notifications").insert([notificationData])
    ),
};
