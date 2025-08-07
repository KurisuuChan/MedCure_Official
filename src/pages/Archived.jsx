import React, { useState, useEffect } from "react";
import { supabase } from "@/supabase/client";
import { Archive, RotateCcw, PackageX } from "lucide-react";

const Archived = () => {
  const [archivedProducts, setArchivedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchArchivedProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("status", "Archived");

    if (error) {
      console.error("Error fetching archived products:", error);
      setError(error);
    } else {
      setArchivedProducts(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchArchivedProducts();
  }, []);

  const handleUnarchive = async (productId) => {
    const { error } = await supabase
      .from("products")
      .update({ status: "Available" })
      .eq("id", productId);

    if (error) {
      console.error("Error unarchiving product:", error);
    } else {
      fetchArchivedProducts();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Loading archived products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-full text-red-500">
        <p>Error: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg font-sans">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Archive size={32} className="text-gray-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Archived Products
            </h1>
            <p className="text-gray-500 mt-1">
              Products that have been archived are stored here.
            </p>
          </div>
        </div>
      </div>

      {archivedProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {archivedProducts.map((product) => (
            <div
              key={product.id}
              className="bg-gray-50 p-5 rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg text-gray-800">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-500">{product.category}</p>
                </div>
                <button
                  onClick={() => handleUnarchive(product.id)}
                  className="p-2 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors"
                  title="Unarchive Product"
                >
                  <RotateCcw size={18} />
                </button>
              </div>
              <div className="mt-4 text-sm space-y-2">
                <p>
                  <span className="font-semibold">Medicine ID:</span>{" "}
                  {product.medicineId}
                </p>
                <p>
                  <span className="font-semibold">Quantity:</span>{" "}
                  {product.quantity}
                </p>
                <p>
                  <span className="font-semibold">Expire Date:</span>{" "}
                  {product.expireDate}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-500">
          <PackageX size={48} className="mx-auto mb-4" />
          <h2 className="text-2xl font-semibold">No Archived Products</h2>
          <p className="text-md">
            When you archive products from the management page, they will appear
            here.
          </p>
        </div>
      )}
    </div>
  );
};

export default Archived;
