import React, { useState, useEffect } from "react";
import { useProductSearch } from "@/hooks/useProductSearch";
import { usePagination } from "@/hooks/usePagination.jsx";
import { useProducts } from "@/hooks/useProducts";
import { useProductMutations } from "@/hooks/useProductMutations.jsx";

// Modals and other components
import AddProductModal from "@/dialogs/AddProductModal";
import EditProductModal from "@/dialogs/EditProductModal";
import ViewProductModal from "@/dialogs/ViewProductModal";
import ImportCSVModal from "@/dialogs/ImportCSVModal";
import ExportPDFModal from "@/dialogs/ExportPDFModal";
import ManagementHeader from "./modules/ManagementHeader";
import ProductFilters from "./modules/ProductFilters";
import ProductTable from "./modules/ProductTable";
import { WifiOff, RefreshCw } from "lucide-react";

const Management = () => {
  const { data: products = [], isLoading, isError, refetch } = useProducts();
  const { archiveProducts } = useProductMutations({
    onSuccess: () => setSelectedItems([]), // Clear selection on success
  });

  const [selectedItems, setSelectedItems] = useState([]);
  const [modals, setModals] = useState({
    add: false,
    edit: false,
    view: false,
    import: false,
    export: false,
  });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeFilters, setActiveFilters] = useState({
    status: "All",
    productType: "All",
  });

  const filteredProducts = React.useMemo(() => {
    return (products || []).filter((product) => {
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
  } = usePagination(searchedProducts);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilters, searchTerm, setCurrentPage]);

  const handleArchiveSelected = () => {
    if (selectedItems.length > 0) {
      archiveProducts(selectedItems);
    }
  };

  const openModal = (modalName, product = null) => {
    setSelectedProduct(product);
    setModals((prev) => ({ ...prev, [modalName]: true }));
  };

  const closeModal = (modalName) => {
    setModals((prev) => ({ ...prev, [modalName]: false }));
    setSelectedProduct(null);
  };

  if (isLoading)
    return <div className="text-center p-8">Loading products...</div>;
  if (isError)
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <WifiOff size={48} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          Connection Error
        </h2>
        <p className="text-gray-600 mb-6">
          There was a problem fetching the data.
        </p>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg"
        >
          <RefreshCw size={16} /> Try Again
        </button>
      </div>
    );

  return (
    <>
      <AddProductModal
        isOpen={modals.add}
        onClose={() => closeModal("add")}
        onProductAdded={refetch}
      />
      <ImportCSVModal
        isOpen={modals.import}
        onClose={() => closeModal("import")}
        onImportSuccess={refetch}
      />
      <ExportPDFModal
        isOpen={modals.export}
        onClose={() => closeModal("export")}
        allProducts={filteredProducts}
      />
      {selectedProduct && (
        <>
          <EditProductModal
            isOpen={modals.edit}
            onClose={() => closeModal("edit")}
            product={selectedProduct}
            onProductUpdated={refetch}
          />
          <ViewProductModal
            isOpen={modals.view}
            onClose={() => closeModal("view")}
            product={selectedProduct}
          />
        </>
      )}

      <div className="bg-white p-8 rounded-2xl shadow-lg font-sans">
        <ManagementHeader
          selectedItemsCount={selectedItems.length}
          onAddProduct={() => openModal("add")}
          onArchiveSelected={handleArchiveSelected}
          onImport={() => openModal("import")}
          onExport={() => openModal("export")}
        />
        <div className="flex items-center justify-between gap-4 py-4 border-t border-b border-gray-200 mb-6">
          <ProductFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            activeFilters={activeFilters}
            onFilterChange={(name, value) =>
              setActiveFilters((prev) => ({ ...prev, [name]: value }))
            }
          />
          <ItemsPerPageComponent />
        </div>

        <ProductTable
          products={paginatedProducts}
          selectedItems={selectedItems}
          setSelectedItems={setSelectedItems}
          searchedProducts={searchedProducts}
          onViewProduct={(product) => openModal("view", product)}
          onEditProduct={(product) => openModal("edit", product)}
          highlightedRow={null}
        />
        <PaginationComponent />
      </div>
    </>
  );
};

export default Management;
