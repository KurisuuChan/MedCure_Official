import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      customer: {
        name: "",
        phone: "",
      },
      payment: {
        method: "cash",
        amountPaid: 0,
      },

      // Cart actions
      addItem: (product, quantity = 1, unitType = "piece") => {
        const { items } = get();
        const existingItem = items.find(
          (item) => item.id === product.id && item.unitType === unitType
        );

        if (existingItem) {
          set({
            items: items.map((item) =>
              item.id === product.id && item.unitType === unitType
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
          });
        } else {
          const unitPrice = product.selling_price;
          const newItem = {
            id: product.id,
            productId: product.id,
            name: product.name,
            batchNumber: product.batch_number,
            unitPrice,
            quantity,
            unitType,
            totalPrice: unitPrice * quantity,
            stockAvailable: product.stock_quantity,
          };

          set({ items: [...items, newItem] });
        }
      },

      removeItem: (productId, unitType) => {
        const { items } = get();
        set({
          items: items.filter(
            (item) => !(item.id === productId && item.unitType === unitType)
          ),
        });
      },

      updateQuantity: (productId, unitType, newQuantity) => {
        const { items } = get();
        if (newQuantity <= 0) {
          get().removeItem(productId, unitType);
          return;
        }

        set({
          items: items.map((item) =>
            item.id === productId && item.unitType === unitType
              ? {
                  ...item,
                  quantity: newQuantity,
                  totalPrice: item.unitPrice * newQuantity,
                }
              : item
          ),
        });
      },

      clearCart: () => {
        set({
          items: [],
          customer: { name: "", phone: "" },
          payment: { method: "cash", amountPaid: 0 },
        });
      },

      // Customer actions
      setCustomer: (customer) => {
        set({ customer });
      },

      // Payment actions
      setPayment: (payment) => {
        set({ payment });
      },

      // Computed values
      getSubtotal: () => {
        const { items } = get();
        return items.reduce((sum, item) => sum + item.totalPrice, 0);
      },

      getTaxAmount: () => {
        // 12% VAT in Philippines
        return get().getSubtotal() * 0.12;
      },

      getDiscountAmount: () => {
        // Placeholder for discount logic
        return 0;
      },

      getTotal: () => {
        return (
          get().getSubtotal() + get().getTaxAmount() - get().getDiscountAmount()
        );
      },

      getChange: () => {
        const { payment } = get();
        return Math.max(0, payment.amountPaid - get().getTotal());
      },

      // Validation
      canProcessSale: () => {
        const { items, payment } = get();
        return (
          items.length > 0 &&
          payment.amountPaid >= get().getTotal() &&
          items.every((item) => item.quantity <= item.stockAvailable)
        );
      },
    }),
    {
      name: "medcure-cart-storage",
      partialize: (state) => ({ items: state.items, customer: state.customer }),
    }
  )
);
