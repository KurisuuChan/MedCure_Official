import { useState } from "react";
import {
  Search,
  Filter,
  X,
  ChevronDown,
  DollarSign,
  Package,
  Calendar,
  Scan,
} from "lucide-react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Card } from "./ui/Card";

export const AdvancedSearchFilter = ({
  searchTerm,
  onSearchChange,
  filters,
  onFiltersChange,
  categories = [],
  onScanBarcode,
  className = "",
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handlePriceRangeChange = (type, value) => {
    const newPriceRange = {
      ...localFilters.priceRange,
      [type]: value ? parseFloat(value) : undefined,
    };
    handleFilterChange("priceRange", newPriceRange);
  };

  const handleStockRangeChange = (type, value) => {
    const newStockRange = {
      ...localFilters.stockRange,
      [type]: value ? parseInt(value) : undefined,
    };
    handleFilterChange("stockRange", newStockRange);
  };

  const clearFilters = () => {
    const clearedFilters = {
      status: "all",
      category: "all",
      priceRange: {},
      stockRange: {},
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = () => {
    return (
      localFilters.status !== "all" ||
      localFilters.category !== "all" ||
      Object.keys(localFilters.priceRange || {}).length > 0 ||
      Object.keys(localFilters.stockRange || {}).length > 0
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search products by name, generic name, batch number, or brand..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-12"
          />
          {onScanBarcode && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onScanBarcode}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1"
              title="Scan Barcode"
            >
              <Scan className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={showAdvanced ? "default" : "outline"}
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Advanced
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                showAdvanced ? "rotate-180" : ""
              }`}
            />
          </Button>

          {hasActiveFilters() && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Quick filters:</span>

        <select
          value={localFilters.status || "all"}
          onChange={(e) => handleFilterChange("status", e.target.value)}
          className="px-3 py-1 text-sm border border-border rounded-md bg-background text-foreground"
        >
          <option value="all">All Status</option>
          <option value="good">Good Condition</option>
          <option value="low_stock">Low Stock</option>
          <option value="expiring_soon">Expiring Soon</option>
          <option value="expired">Expired</option>
        </select>

        <select
          value={localFilters.category || "all"}
          onChange={(e) => handleFilterChange("category", e.target.value)}
          className="px-3 py-1 text-sm border border-border rounded-md bg-background text-foreground"
        >
          <option value="all">All Categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Price Range */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-medium text-foreground">
                  Price Range
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Min price"
                  value={localFilters.priceRange?.min || ""}
                  onChange={(e) =>
                    handlePriceRangeChange("min", e.target.value)
                  }
                  className="flex-1"
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  type="number"
                  placeholder="Max price"
                  value={localFilters.priceRange?.max || ""}
                  onChange={(e) =>
                    handlePriceRangeChange("max", e.target.value)
                  }
                  className="flex-1"
                />
              </div>
            </div>

            {/* Stock Range */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-medium text-foreground">
                  Stock Range
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Min stock"
                  value={localFilters.stockRange?.min || ""}
                  onChange={(e) =>
                    handleStockRangeChange("min", e.target.value)
                  }
                  className="flex-1"
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  type="number"
                  placeholder="Max stock"
                  value={localFilters.stockRange?.max || ""}
                  onChange={(e) =>
                    handleStockRangeChange("max", e.target.value)
                  }
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
