import { useState } from "react";
import { Download, FileText, File } from "lucide-react";
import { Button } from "./ui/Button";

export const ExportButton = ({
  data,
  filename = "products",
  variant = "outline",
  size = "sm",
  className = "",
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      alert("No data to export");
      return;
    }

    // Get all unique keys from all objects
    const headers = Object.keys(data[0]);

    // Create CSV content
    const csvContent = [
      headers.join(","), // Header row
      ...data.map((row) =>
        headers
          .map((header) => {
            let value = row[header];

            // Handle nested objects (like categories)
            if (typeof value === "object" && value !== null) {
              value = value.name || JSON.stringify(value);
            }

            // Escape commas and quotes
            if (typeof value === "string") {
              value = value.replace(/"/g, '""');
              if (
                value.includes(",") ||
                value.includes('"') ||
                value.includes("\n")
              ) {
                value = `"${value}"`;
              }
            }

            return value || "";
          })
          .join(",")
      ),
    ].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${filename}_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDataForExport = (products) => {
    return products.map((product) => ({
      "Product Name": product.name,
      "Generic Name": product.generic_name || "",
      Brand: product.brand || "",
      Category: product.categories?.name || "Uncategorized",
      "Batch Number": product.batch_number,
      "Stock Quantity": product.stock_quantity,
      "Min Stock Level": product.min_stock_level,
      "Cost Price": product.cost_price,
      "Selling Price": product.selling_price,
      "Expiry Date": new Date(product.expiry_date).toLocaleDateString(),
      Manufacturer: product.manufacturer || "",
      Description: product.description || "",
      Status: getProductStatus(product),
      "Created At": new Date(product.created_at).toLocaleDateString(),
    }));
  };

  const getProductStatus = (product) => {
    const today = new Date();
    const expiry = new Date(product.expiry_date);
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry <= 0) return "Expired";
    if (daysUntilExpiry <= 30) return "Expiring Soon";
    if (product.stock_quantity <= product.min_stock_level) return "Low Stock";
    return "Good";
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const formattedData = formatDataForExport(data);
      exportToCSV(formattedData, filename);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExport}
      disabled={isExporting || !data || data.length === 0}
      className={className}
    >
      {isExporting ? (
        <File className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Download className="h-4 w-4 mr-2" />
      )}
      {isExporting ? "Exporting..." : "Export CSV"}
    </Button>
  );
};
