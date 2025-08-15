import { supabase, handleSupabaseQuery } from "./supabaseClient";

export const productsApi = {
  list: () =>
    handleSupabaseQuery(
      supabase
        .from("products")
        .select("*, product_variants(*)")
        .neq("status", "Archived")
    ),
  listArchived: () =>
    handleSupabaseQuery(
      supabase
        .from("products")
        .select("*, product_variants(*)")
        .eq("status", "Archived")
    ),
  getById: (id) =>
    handleSupabaseQuery(
      supabase.from("products").select("*").eq("id", id).single()
    ),
  create: (productData) =>
    handleSupabaseQuery(
      supabase.from("products").insert([productData]).select().single()
    ),
  update: (id, productData) =>
    handleSupabaseQuery(
      supabase.from("products").update(productData).eq("id", id)
    ),
  archive: (ids) =>
    handleSupabaseQuery(
      supabase.from("products").update({ status: "Archived" }).in("id", ids)
    ),
  unarchive: (ids) =>
    handleSupabaseQuery(
      supabase.from("products").update({ status: "Available" }).in("id", ids)
    ),
  delete: (ids) =>
    handleSupabaseQuery(supabase.from("products").delete().in("id", ids)),
};
