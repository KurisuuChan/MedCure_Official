import { supabase } from "@/supabase/client";

// Authentication
export const signIn = (email, password) =>
  supabase.auth.signInWithPassword({ email, password });
export const signOut = () => supabase.auth.signOut();
export const getSession = () => supabase.auth.getSession();
export const onAuthStateChange = (callback) =>
  supabase.auth.onAuthStateChange(callback);
export const getUser = () => supabase.auth.getUser();
export const updateUser = (userData) => supabase.auth.updateUser(userData);

// Products
export const getProducts = () =>
  supabase.from("products").select("*").neq("status", "Archived");
export const getProductById = (id) =>
  supabase.from("products").select("*").eq("id", id).single();
export const addProduct = (productData) =>
  supabase.from("products").insert([productData]);
export const updateProduct = (id, productData) =>
  supabase.from("products").update(productData).eq("id", id);
export const deleteProduct = (id) =>
  supabase.from("products").delete().eq("id", id);
export const getProductsByIds = (ids) =>
  supabase.from("products").select("*").in("id", ids);
export const getArchivedProducts = () =>
  supabase.from("products").select("*").eq("status", "Archived");
export const getAvailableProducts = () =>
  supabase
    .from("products")
    .select("*")
    .eq("status", "Available")
    .gt("quantity", 0);
export const getLastProductId = () =>
  supabase
    .from("products")
    .select("id")
    .order("id", { ascending: false })
    .limit(1)
    .single();
export const insertProducts = (products) =>
  supabase.from("products").insert(products);

// Sales
export const getSalesHistory = () =>
  supabase
    .from("sales")
    .select(`*, sale_items (*, products (name))`)
    .order("created_at", { ascending: false });
export const addSale = (saleData) =>
  supabase.from("sales").insert(saleData).select().single();

// Sale Items
export const addSaleItems = (items) =>
  supabase.from("sale_items").insert(items);
export const getRecentSaleItems = () =>
  supabase
    .from("sale_items")
    .select("*, products(name), sales(created_at)")
    .order("id", { ascending: false })
    .limit(5);
export const getAllSaleItems = () =>
  supabase
    .from("sale_items")
    .select("quantity, price_at_sale, products (name, category)");

// Branding
export const getBranding = () =>
  supabase.from("branding").select("name, logo_url").eq("id", 1).single();
export const updateBranding = (brandingData) =>
  supabase.from("branding").update(brandingData).eq("id", 1);

// Storage
export const uploadFile = (bucket, path, file) =>
  supabase.storage.from(bucket).upload(path, file);
export const getPublicUrl = (bucket, path) =>
  supabase.storage.from(bucket).getPublicUrl(path);
