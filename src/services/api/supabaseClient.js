import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key are required.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Custom AppError for consistent error handling
export class AppError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "AppError";
    this.details = details;
  }
}

/**
 * Wraps a Supabase query to handle errors consistently.
 * @param {Promise} query - The Supabase query promise.
 * @returns {Promise<{data: any, error: AppError|null}>}
 */
export const handleSupabaseQuery = async (query) => {
  const { data, error } = await query;
  if (error) {
    console.error("Supabase API Error:", error);
    return { data: null, error: new AppError(error.message, error) };
  }
  return { data, error: null };
};
