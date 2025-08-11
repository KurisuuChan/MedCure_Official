import React, { useState, useEffect } from "react";
import { supabase } from "@/supabase/client";
import { Archive, RotateCcw, PackageX, Trash2, Search } from "lucide-react";
import { useNotification } from "@/hooks/useNotification";
import { useProductSearch } from "@/hooks/useProductSearch";
import { usePagination } from "@/hooks/usePagination.jsx";

const Archived = () => {
  const [archivedProducts, setArchivedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addNotification } = useNotification();

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
      addNotification(`Error: ${error.message}`, "error");
    } else {
      addNotification("Product successfully unarchived.", "success");
      fetchArchivedProducts();
    }
  };

  const handleDeletePermanent = async (productId) => {
    if (
      window.confirm(
        "Are you sure you want to permanently delete this product? This action cannot be undone."
      )
    ) {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);

      if (error) {
        addNotification(`Error: ${error.message}`, "error");
      } else {
        addNotification("Product permanently deleted.", "success");
        fetchArchivedProducts();
      }
    }
  };

  const { searchTerm, setSearchTerm, searchedProducts } =
    useProductSearch(archivedProducts);
  const { paginatedData, PaginationComponent } =
    usePagination(searchedProducts);

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Archive size={32} className="text-gray-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Archived Products
            </h1>
            <p className="text-gray-500 mt-1">
              Manage and review products that have been archived.
            </p>
          </div>
        </div>
        <div className="relative w-full sm:w-64">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search archived..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {paginatedData.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedData.map((product) => (
              <div
                key={product.id}
                className="bg-gray-50 p-5 rounded-xl border border-gray-200 hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <h3 className="font-bold text-lg text-gray-800">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-500">{product.category}</p>
                  <div className="mt-4 text-sm space-y-2 border-t pt-4">
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
                <div className="flex items-center justify-end gap-2 mt-4">
                  <button
                    onClick={() => handleDeletePermanent(product.id)}
                    className="p-2 rounded-full text-gray-500 hover:bg-red-100 hover:text-red-600 transition-colors"
                    title="Delete Permanently"
                  >
                    <Trash2 size={18} />
                  </button>
                  <button
                    onClick={() => handleUnarchive(product.id)}
                    className="p-2 rounded-full text-gray-500 hover:bg-green-100 hover:text-green-700 transition-colors"
                    title="Unarchive Product"
                  >
                    <RotateCcw size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <PaginationComponent />
        </>
      ) : (
        <div className="text-center py-20 text-gray-500">
          <PackageX size={48} className="mx-auto mb-4" />
          <h2 className="text-2xl font-semibold">No Archived Products Found</h2>
          <p className="text-md">
            Your search for "{searchTerm}" did not return any results.
          </p>
        </div>
      )}
    </div>
  );
};

export default Archived;
