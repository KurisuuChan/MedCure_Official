import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/supabase/client";
import { useProductSearch } from "@/hooks/useProductSearch";
import { usePagination } from "@/hooks/usePagination.jsx";

// Import all dialogs/modals
import AddProductModal from "@/dialogs/AddProductModal";
import EditProductModal from "@/dialogs/EditProductModal";
import ViewProductModal from "@/dialogs/ViewProductModal";
import ImportCSVModal from "@/dialogs/ImportCSVModal";
import ExportPDFModal from "@/dialogs/ExportPDFModal";

// Import page-specific components
import ManagementHeader from "./modules/ManagementHeader";
import ProductFilters from "./modules/ProductFilters";
import ProductTable from "./modules/ProductTable";

const Management = () => {
  const [products, setProducts] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for all modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeFilters, setActiveFilters] = useState({
    status: "All",
    productType: "All",
  });

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select()
      .neq("status", "Archived");
    if (error) {
      console.error("Error fetching products:", error);
      setError(error);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleArchiveSelected = async () => {
    if (selectedItems.length === 0) return;
    const { error } = await supabase
      .from("products")
      .update({ status: "Archived" })
      .in("id", selectedItems);

    if (error) {
      console.error("Error archiving products:", error);
    } else {
      fetchProducts();
      setSelectedItems([]);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const statusMatch =
        activeFilters.status === "All" ||
        product.status === activeFilters.status;
      const typeMatch =
        activeFilters.productType === "All" ||
        product.productType === activeFilters.productType;
      return statusMatch && typeMatch;
    });
  }, [products, activeFilters]);

  const { searchTerm, setSearchTerm, searchedProducts } =
    useProductSearch(filteredProducts);

  const {
    paginatedData: paginatedProducts,
    PaginationComponent,
    ItemsPerPageComponent,
  } = usePagination(searchedProducts);

  const handleFilterChange = (filterName, value) => {
    setActiveFilters((prev) => ({ ...prev, [filterName]: value }));
  };

  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setIsViewModalOpen(true);
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
  };

  if (loading) return <div className="text-center p-8">Loading...</div>;
  if (error)
    return (
      <div className="text-center p-8 text-red-500">
        Error fetching data: {error.message}
      </div>
    );

  return (
    <>
      {/* All Modals */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onProductAdded={fetchProducts}
      />
      <ImportCSVModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={fetchProducts}
      />
      <ExportPDFModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        allProducts={products}
      />
      {selectedProduct && (
        <>
          <EditProductModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            product={selectedProduct}
            onProductUpdated={fetchProducts}
          />
          <ViewProductModal
            isOpen={isViewModalOpen}
            onClose={() => setIsViewModalOpen(false)}
            product={selectedProduct}
          />
        </>
      )}

      {/* Main Page Content */}
      <div className="bg-white p-8 rounded-2xl shadow-lg font-sans">
        <ManagementHeader
          selectedItemsCount={selectedItems.length}
          onAddProduct={() => setIsAddModalOpen(true)}
          onArchiveSelected={handleArchiveSelected}
          onImport={() => setIsImportModalOpen(true)}
          onExport={() => setIsExportModalOpen(true)}
        />
        <div className="flex items-center justify-between gap-4 py-4 border-t border-b border-gray-200 mb-6">
          <ProductFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            activeFilters={activeFilters}
            onFilterChange={handleFilterChange}
          />
          <ItemsPerPageComponent />
        </div>
        <ProductTable
          products={paginatedProducts}
          selectedItems={selectedItems}
          setSelectedItems={setSelectedItems}
          searchedProducts={searchedProducts}
          onViewProduct={handleViewProduct}
          onEditProduct={handleEditProduct}
        />
        <PaginationComponent />
      </div>
    </>
  );
};

export default Management;
