import React, { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/supabase/client";
import { useProductSearch } from "@/hooks/useProductSearch";
import { usePagination } from "@/hooks/usePagination.jsx";
import { useNotification } from "@/hooks/useNotification";

import AddProductModal from "@/dialogs/AddProductModal";
import EditProductModal from "@/dialogs/EditProductModal";
import ViewProductModal from "@/dialogs/ViewProductModal";
import ImportCSVModal from "@/dialogs/ImportCSVModal";
import ExportPDFModal from "@/dialogs/ExportPDFModal";

import ManagementHeader from "./modules/ManagementHeader";
import ProductFilters from "./modules/ProductFilters";
import ProductTable from "./modules/ProductTable";

const Management = () => {
  const [products, setProducts] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const location = useLocation();
  const [highlightedRow, setHighlightedRow] = useState(null);
  const { addNotification } = useNotification();

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
    setCurrentPage,
    itemsPerPage,
  } = usePagination(searchedProducts);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const highlightId = params.get("highlight");
    if (highlightId && products.length > 0) {
      const highlightIdNum = parseInt(highlightId, 10);
      const productIndex = products.findIndex((p) => p.id === highlightIdNum);

      if (productIndex !== -1) {
        setActiveFilters({ status: "All", productType: "All" });
        setSearchTerm("");

        const pageNumber = Math.ceil((productIndex + 1) / itemsPerPage);
        setCurrentPage(pageNumber);
        setHighlightedRow(highlightIdNum);

        const timer = setTimeout(() => setHighlightedRow(null), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [location, products, itemsPerPage, setCurrentPage, setSearchTerm]);

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
      addNotification(`Error: ${error.message}`, "error");
    } else {
      addNotification(
        `${selectedItems.length} product(s) successfully archived.`,
        "success"
      );
      fetchProducts();
      setSelectedItems([]);
    }
  };

  const handleFilterChange = (filterName, value) => {
    setActiveFilters((prev) => ({ ...prev, [filterName]: value }));
    setCurrentPage(1);
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
          highlightedRow={highlightedRow}
        />
        <PaginationComponent />
      </div>
    </>
  );
};

export default Management;
