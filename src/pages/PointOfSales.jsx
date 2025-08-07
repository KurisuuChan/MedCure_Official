import React, { useState, useMemo, useEffect } from "react";
import PropTypes from "prop-types";
import { supabase } from "@/supabase/client";
import {
  Search,
  Plus,
  Minus,
  X,
  ShoppingCart,
  Loader2,
  History,
} from "lucide-react";
import SalesHistoryModal from "@/dialogs/SalesHistoryModal";
import { generateReceiptPDF } from "@/utils/pdfGenerator";

const PointOfSales = ({ branding }) => {
  const [availableMedicines, setAvailableMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDiscounted, setIsDiscounted] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const PWD_SENIOR_DISCOUNT = 0.2;

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("status", "Available")
      .gt("quantity", 0);

    if (error) {
      console.error("Error fetching products:", error);
    } else {
      setAvailableMedicines(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSelectMedicine = (medicine) => {
    setCart((prevCart) => {
      const itemInCart = prevCart.find((item) => item.id === medicine.id);
      if (itemInCart) {
        return prevCart.map((item) =>
          item.id === medicine.id && item.quantity < medicine.quantity
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { ...medicine, quantity: 1 }];
      }
    });
  };

  const updateQuantity = (medicineId, newQuantity) => {
    const medicine = availableMedicines.find((m) => m.id === medicineId);
    if (newQuantity < 1) {
      setCart(cart.filter((item) => item.id !== medicineId));
    } else if (medicine && newQuantity <= medicine.quantity) {
      setCart(
        cart.map((item) =>
          item.id === medicineId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const total = useMemo(() => {
    const subtotal = cart.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );
    return isDiscounted ? subtotal * (1 - PWD_SENIOR_DISCOUNT) : subtotal;
  }, [cart, isDiscounted]);

  const filteredMedicines = useMemo(
    () =>
      availableMedicines.filter((med) =>
        med.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [availableMedicines, searchTerm]
  );

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);

    try {
      const { data: saleData, error: saleError } = await supabase
        .from("sales")
        .insert({ total_amount: total, discount_applied: isDiscounted })
        .select()
        .single();

      if (saleError) throw saleError;

      const saleItemsToInsert = cart.map((item) => ({
        sale_id: saleData.id,
        product_id: item.id,
        quantity: item.quantity,
        price_at_sale: item.price,
      }));

      const { error: saleItemsError } = await supabase
        .from("sale_items")
        .insert(saleItemsToInsert);
      if (saleItemsError) throw saleItemsError;

      for (const item of cart) {
        const { data: product, error: fetchError } = await supabase
          .from("products")
          .select("quantity")
          .eq("id", item.id)
          .single();
        if (fetchError) throw fetchError;
        const newQuantity = product.quantity - item.quantity;
        const { error: updateError } = await supabase
          .from("products")
          .update({ quantity: newQuantity })
          .eq("id", item.id);
        if (updateError) throw updateError;
      }

      const saleDetailsForReceipt = { ...saleData, items: cart };
      await generateReceiptPDF(saleDetailsForReceipt, branding);

      setCart([]);
      setIsDiscounted(false);
      fetchProducts();
    } catch (error) {
      console.error("Checkout failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SalesHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        branding={branding}
      />
      <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-110px)]">
        <div className="flex-1 lg:w-3/5 bg-white p-6 rounded-2xl shadow-lg flex flex-col">
          <div className="flex items-center gap-4 mb-4 flex-shrink-0">
            <div className="relative flex-1">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                id="pos-search"
                name="pos-search"
                placeholder="Search medicine..."
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => setIsHistoryModalOpen(true)}
              className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-3 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              <History size={18} />
              History
            </button>
          </div>
          <div className="flex-1 overflow-y-auto -m-2 p-2">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="animate-spin text-blue-500" size={32} />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredMedicines.map((med) => (
                  <button
                    key={med.id}
                    onClick={() => handleSelectMedicine(med)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 text-left ${
                      cart.some((item) => item.id === med.id)
                        ? "bg-blue-50 border-blue-500 shadow-md"
                        : "hover:shadow-md hover:border-blue-400"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-gray-800 leading-tight">
                        {med.name}
                      </h3>
                      <span className="text-sm font-bold text-gray-800 whitespace-nowrap">
                        ₱{med.price.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{med.category}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {med.quantity} available
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="lg:w-2/5 bg-white p-6 rounded-2xl shadow-lg flex flex-col">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4 flex-shrink-0">
            Order Summary
          </h2>
          <div className="flex-1 overflow-y-auto -mr-4 pr-4">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <ShoppingCart size={48} className="mb-2" />
                <p className="text-lg font-medium">Your cart is empty</p>
                <p className="text-sm">Select items to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <div className="flex-grow">
                      <p className="font-semibold text-gray-800">{item.name}</p>
                      <p className="text-sm text-gray-600">
                        ₱{item.price.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                        className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center font-medium">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <p className="w-20 text-right font-bold">
                      ₱{(item.price * item.quantity).toFixed(2)}
                    </p>
                    <button
                      onClick={() => updateQuantity(item.id, 0)}
                      className="text-gray-400 hover:text-red-500 p-1"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="mt-auto pt-6 border-t-2 border-dashed flex-shrink-0">
            <div className="flex justify-between items-center mb-4">
              <span className="font-medium text-gray-600">
                PWD/Senior Discount (20%)
              </span>
              <button
                onClick={() => setIsDiscounted(!isDiscounted)}
                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
                  isDiscounted ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                    isDiscounted ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            <div className="flex justify-between items-center text-2xl font-bold text-gray-800 mb-6">
              <span>Total:</span>
              <span>₱{total.toFixed(2)}</span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full py-4 bg-blue-600 text-white font-bold text-lg rounded-xl hover:bg-blue-700 transition-colors shadow-lg disabled:bg-blue-300 disabled:shadow-none"
              disabled={loading || cart.length === 0}
            >
              {loading ? (
                <Loader2 className="animate-spin mx-auto" />
              ) : (
                "Complete Sale"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

PointOfSales.propTypes = {
  branding: PropTypes.object.isRequired,
};

export default PointOfSales;
