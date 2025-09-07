import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export const useSales = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const processSale = async (saleData, items) => {
    try {
      setLoading(true);
      setError(null);

      // Prepare sale data
      const salePayload = {
        customer_name: saleData.customer.name || null,
        customer_phone: saleData.customer.phone || null,
        subtotal: saleData.subtotal,
        tax_amount: saleData.taxAmount,
        discount_amount: saleData.discountAmount,
        total_amount: saleData.total,
        payment_method: saleData.payment.method,
        amount_paid: saleData.payment.amountPaid,
        change_amount: saleData.change,
        cashier_id: user.id,
        notes: saleData.notes || null,
      };

      // Prepare items data
      const itemsPayload = items.map((item) => ({
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.totalPrice,
        unit_type: item.unitType,
      }));

      // Call the stored procedure to process the sale atomically
      const { data, error: saleError } = await supabase.rpc("process_sale", {
        sale_data: salePayload,
        items_data: itemsPayload,
      });

      if (saleError) throw saleError;

      return { success: true, saleId: data };
    } catch (err) {
      console.error("Error processing sale:", err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const voidSale = async (saleId, reason) => {
    try {
      setLoading(true);
      setError(null);

      const { error: voidError } = await supabase.rpc("void_sale_transaction", {
        sale_id_param: saleId,
        void_reason_param: reason,
        voided_by_param: user.id,
      });

      if (voidError) throw voidError;

      return { success: true };
    } catch (err) {
      console.error("Error voiding sale:", err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const getSaleById = async (saleId) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("sales")
        .select(
          `
          *,
          sale_items (
            *,
            products (name, batch_number)
          ),
          cashier:user_profiles!sales_cashier_id_fkey (
            full_name
          ),
          voided_by_user:user_profiles!sales_voided_by_fkey (
            full_name
          )
        `
        )
        .eq("id", saleId)
        .single();

      if (fetchError) throw fetchError;

      return { success: true, sale: data };
    } catch (err) {
      console.error("Error fetching sale:", err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    processSale,
    voidSale,
    getSaleById,
  };
};
