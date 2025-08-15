import { supabase, handleSupabaseQuery } from "./supabaseClient";

/**
 * A dedicated module for all API interactions related to sales and sale items.
 */
export const salesApi = {
  /**
   * Fetches all sales records.
   * @returns {Promise<{data: Array, error: AppError|null}>} A list of sales.
   */
  list: () =>
    handleSupabaseQuery(
      supabase
        .from("sales")
        .select("*")
        .order("created_at", { ascending: false })
    ),

  /**
   * Fetches all sales records along with their associated sale items.
   * This is useful for pages that need to display detailed sale history.
   * @returns {Promise<{data: Array, error: AppError|null}>} A list of sales with nested items.
   */
  listWithItems: () =>
    handleSupabaseQuery(
      supabase
        .from("sales")
        .select("*, sale_items(*, products(name), product_variants(unit_type))")
        .order("created_at", { ascending: false })
    ),

  /**
   * Fetches the 5 most recent sale items for the dashboard widget.
   * @returns {Promise<{data: Array, error: AppError|null}>} A list of recent sale items.
   */
  listRecentItems: () =>
    handleSupabaseQuery(
      supabase
        .from("sale_items")
        .select("*, products(name), sales(created_at)")
        .order("id", { ascending: false })
        .limit(5)
    ),

  /**
   * Fetches all sale items with related product data for financial calculations.
   * @returns {Promise<{data: Array, error: AppError|null}>} A comprehensive list of all sale items.
   */
  listAllItems: () =>
    handleSupabaseQuery(
      supabase
        .from("sale_items")
        .select(
          "quantity, price_at_sale, sales(created_at), products (name, category, cost_price)"
        )
    ),

  /**
   * Creates a new sale record in the database.
   * @param {object} saleData - The data for the new sale.
   * @returns {Promise<{data: object, error: AppError|null}>} The newly created sale record.
   */
  createSale: (saleData) =>
    handleSupabaseQuery(
      supabase.from("sales").insert([saleData]).select().single()
    ),

  /**
   * Creates multiple sale item records in the database.
   * @param {Array<object>} itemsData - An array of sale item objects to insert.
   * @returns {Promise<{data: Array, error: AppError|null}>} The newly created sale item records.
   */
  createSaleItems: (itemsData) =>
    handleSupabaseQuery(supabase.from("sale_items").insert(itemsData)),
};
