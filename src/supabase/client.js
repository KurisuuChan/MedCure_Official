import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key are required.");
}

// Create and export a SINGLE, SHARED instance of the Supabase client.
// All other files in your application will import this instance.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
