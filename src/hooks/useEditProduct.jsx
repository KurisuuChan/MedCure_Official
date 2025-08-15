// src/hooks/useEditProduct.jsx
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import * as api from "@/services/api";
import { useNotification } from "@/hooks/useNotifications";

export const useEditProduct = (product, onSuccess) => {
  const [formData, setFormData] = useState(product);
  const [variants, setVariants] = useState(product?.product_variants || []);
  const [variantsToRemove, setVariantsToRemove] = useState([]);
  const { addNotification: showToast } = useNotification();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Deep copy to prevent state mutation issues
    setFormData(JSON.parse(JSON.stringify(product)));
    setVariants(JSON.parse(JSON.stringify(product?.product_variants || [])));
    setVariantsToRemove([]);
  }, [product]);

  const editProductMutation = useMutation({
    // --- DEFINITIVE FIX: Explicitly handle each database operation separately ---
    mutationFn: async ({
      productData,
      newVariantsToInsert,
      existingVariantsToUpdate,
      removedVariantIds,
    }) => {
      // 1. Update the main product details.
      const { error: productError } = await api.updateProduct(
        product.id,
        productData
      );
      if (productError) throw productError;

      // 2. Insert any newly created variants.
      if (newVariantsToInsert.length > 0) {
        const { error: insertError } = await api.supabase
          .from("product_variants")
          .insert(newVariantsToInsert);
        if (insertError) throw insertError;
      }

      // 3. Update any variants that already existed.
      if (existingVariantsToUpdate.length > 0) {
        for (const variant of existingVariantsToUpdate) {
          const { id, ...updateData } = variant; // Separate ID from the rest of the data
          const { error: updateError } = await api.supabase
            .from("product_variants")
            .update(updateData)
            .eq("id", id); // Use the ID only in the 'eq' filter
          if (updateError) throw updateError;
        }
      }

      // 4. Attempt to delete variants marked for removal.
      if (removedVariantIds.length > 0) {
        const { error: deleteError } = await api.supabase
          .from("product_variants")
          .delete()
          .in("id", removedVariantIds);

        if (deleteError && deleteError.code === "23503") {
          showToast(
            "Could not delete a variant because it's part of a past sale.",
            "warning"
          );
        } else if (deleteError) {
          throw deleteError;
        }
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      showToast("Product updated successfully!", "success");
      if (product?.price !== variables.productData.price) {
        api.addNotification({
          type: "price_change",
          title: "Price Updated",
          description: `Price for ${variables.productData.name} changed from ₱${product.price} to ₱${variables.productData.price}.`,
          path: "/management",
        });
      }
      onSuccess();
    },
    onError: (err) => {
      showToast(`Error updating product: ${err.message}`, "error");
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleVariantChange = (id, field, value) => {
    let newVariants = variants.map((v) =>
      v.id === id ? { ...v, [field]: value } : v
    );
    if (field === "is_default" && value === true) {
      newVariants = newVariants.map((v) =>
        v.id === id ? v : { ...v, is_default: false }
      );
    }
    setVariants(newVariants);
  };

  const addVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`, // Temporary front-end ID
        unit_type: "piece",
        unit_price: "",
        units_per_variant: 1,
        is_default: prev.length === 0,
      },
    ]);
  };

  const removeVariant = (id) => {
    if (variants.length <= 1) return;

    if (typeof id === "number") {
      setVariantsToRemove((prev) => [...prev, id]);
    }

    const newVariants = variants.filter((v) => v.id !== id);
    if (!newVariants.some((v) => v.is_default)) {
      if (newVariants.length > 0) {
        newVariants[0].is_default = true;
      }
    }
    setVariants(newVariants);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const defaultVariantPrice =
      variants.find((v) => v.is_default)?.unit_price ||
      variants[0]?.unit_price ||
      0;

    const productData = {
      ...formData,
      price: parseFloat(defaultVariantPrice) || 0,
      quantity: parseInt(formData.quantity, 10) || 0,
      cost_price: parseFloat(formData.cost_price) || 0,
      expireDate: formData.expireDate || null,
    };

    // Clean the main product object of fields that should not be updated.
    delete productData.id;
    delete productData.product_variants;
    delete productData.created_at;
    delete productData.updated_at;

    // --- DEFINITIVE FIX: Explicitly separate variants into their final forms ---
    const newVariantsToInsert = variants
      .filter((v) => typeof v.id === "string" && v.id.startsWith("new-"))
      .map((v) => ({
        // Create a clean object with NO ID for the database INSERT.
        product_id: product.id,
        unit_type: v.unit_type,
        unit_price: parseFloat(v.unit_price) || 0,
        units_per_variant: parseInt(v.units_per_variant, 10) || 1,
        is_default: v.is_default,
      }));

    const existingVariantsToUpdate = variants
      .filter((v) => typeof v.id === "number")
      .map((v) => ({
        // Create a clean object WITH an ID for the database UPDATE.
        id: v.id,
        product_id: product.id,
        unit_type: v.unit_type,
        unit_price: parseFloat(v.unit_price) || 0,
        units_per_variant: parseInt(v.units_per_variant, 10) || 1,
        is_default: v.is_default,
      }));
    // --- END FIX ---

    editProductMutation.mutate({
      productData,
      newVariantsToInsert,
      existingVariantsToUpdate,
      removedVariantIds: variantsToRemove,
    });
  };

  return {
    formData,
    variants,
    isLoading: editProductMutation.isPending,
    error: editProductMutation.error?.message,
    handleChange,
    handleVariantChange,
    addVariant,
    removeVariant,
    handleSubmit,
  };
};
