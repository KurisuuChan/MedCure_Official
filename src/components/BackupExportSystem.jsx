import React, { useState } from "react";
import {
  Download,
  Upload,
  Database,
  FileText,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { supabase } from "@/lib/supabase";

export const BackupExportSystem = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedTables, setSelectedTables] = useState({
    products: true,
    categories: true,
    sales: true,
    sale_items: true,
    stock_movements: true,
    user_profiles: false, // Don't export user data by default
  });

  const { addToast } = useToast();

  const handleTableSelection = (table) => {
    setSelectedTables((prev) => ({
      ...prev,
      [table]: !prev[table],
    }));
  };

  const exportData = async (format = "json") => {
    setIsExporting(true);
    try {
      const exportData = {};
      const timestamp = new Date().toISOString().split("T")[0];

      // Export selected tables
      for (const [table, selected] of Object.entries(selectedTables)) {
        if (selected) {
          const { data, error } = await supabase
            .from(table)
            .select("*")
            .order("created_at", { ascending: false });

          if (error) throw error;
          exportData[table] = data;
        }
      }

      // Add metadata
      exportData._metadata = {
        exported_at: new Date().toISOString(),
        version: "1.0.0",
        app: "Medcure Pharmacy",
        tables: Object.keys(selectedTables).filter(
          (table) => selectedTables[table]
        ),
        total_records: Object.values(exportData).reduce(
          (sum, data) => sum + (Array.isArray(data) ? data.length : 0),
          0
        ),
      };

      if (format === "json") {
        // Export as JSON
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `medcure-backup-${timestamp}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else if (format === "csv") {
        // Export each table as separate CSV
        for (const [table, data] of Object.entries(exportData)) {
          if (
            table === "_metadata" ||
            !Array.isArray(data) ||
            data.length === 0
          )
            continue;

          const headers = Object.keys(data[0]);
          const csvContent = [
            headers.join(","),
            ...data.map((row) =>
              headers
                .map((header) => {
                  const value = row[header];
                  return typeof value === "string" && value.includes(",")
                    ? `"${value}"`
                    : value;
                })
                .join(",")
            ),
          ].join("\\n");

          const blob = new Blob([csvContent], { type: "text/csv" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${table}-${timestamp}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      }

      addToast({
        type: "success",
        title: "Export Successful",
        message: `Data exported successfully in ${format.toUpperCase()} format`,
      });
    } catch (error) {
      console.error("Export error:", error);
      addToast({
        type: "error",
        title: "Export Failed",
        message: error.message || "Failed to export data",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const generateReport = async (reportType) => {
    setIsExporting(true);
    try {
      let reportData = {};
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const startOfYear = new Date(today.getFullYear(), 0, 1);

      switch (reportType) {
        case "sales_summary": {
          // Get sales data
          const { data: salesData } = await supabase
            .from("sales")
            .select(
              `
              *,
              sale_items (
                quantity,
                unit_price,
                total_price,
                products (name, sku)
              )
            `
            )
            .gte("created_at", startOfMonth.toISOString());

          reportData = {
            title: "Monthly Sales Summary",
            period: `${startOfMonth.toLocaleDateString()} - ${today.toLocaleDateString()}`,
            sales: salesData,
            summary: {
              total_sales: salesData?.length || 0,
              total_revenue:
                salesData?.reduce(
                  (sum, sale) => sum + parseFloat(sale.total_amount || 0),
                  0
                ) || 0,
              average_sale: salesData?.length
                ? salesData.reduce(
                    (sum, sale) => sum + parseFloat(sale.total_amount || 0),
                    0
                  ) / salesData.length
                : 0,
            },
          };
          break;
        }

        case "inventory_report": {
          // Get inventory data
          const { data: inventoryData } = await supabase
            .from("products")
            .select(
              `
              *,
              categories (name),
              stock_movements (
                movement_type,
                quantity,
                created_at
              )
            `
            )
            .eq("is_active", true);

          reportData = {
            title: "Inventory Report",
            generated_at: today.toISOString(),
            products: inventoryData,
            summary: {
              total_products: inventoryData?.length || 0,
              low_stock_items:
                inventoryData?.filter(
                  (p) => p.stock_quantity <= p.reorder_level
                ).length || 0,
              total_value:
                inventoryData?.reduce(
                  (sum, product) =>
                    sum +
                    parseFloat(product.cost_price || 0) *
                      (product.stock_quantity || 0),
                  0
                ) || 0,
            },
          };
          break;
        }

        case "financial_report": {
          // Get financial data
          const { data: financialData } = await supabase
            .from("sales")
            .select("*")
            .gte("created_at", startOfYear.toISOString());

          const monthlyData = {};
          financialData?.forEach((sale) => {
            const month = new Date(sale.created_at)
              .toISOString()
              .substring(0, 7);
            if (!monthlyData[month]) {
              monthlyData[month] = { sales: 0, revenue: 0 };
            }
            monthlyData[month].sales += 1;
            monthlyData[month].revenue += parseFloat(sale.total_amount || 0);
          });

          reportData = {
            title: "Financial Report",
            period: `${startOfYear.toLocaleDateString()} - ${today.toLocaleDateString()}`,
            monthly_breakdown: monthlyData,
            summary: {
              total_revenue: Object.values(monthlyData).reduce(
                (sum, month) => sum + month.revenue,
                0
              ),
              total_sales: Object.values(monthlyData).reduce(
                (sum, month) => sum + month.sales,
                0
              ),
              average_monthly_revenue: Object.values(monthlyData).length
                ? Object.values(monthlyData).reduce(
                    (sum, month) => sum + month.revenue,
                    0
                  ) / Object.values(monthlyData).length
                : 0,
            },
          };
          break;
        }
      }

      // Generate report file
      const timestamp = new Date().toISOString().split("T")[0];
      const blob = new Blob([JSON.stringify(reportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${reportType}-${timestamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      addToast({
        type: "success",
        title: "Report Generated",
        message: `${reportType.replace(
          "_",
          " "
        )} report generated successfully`,
      });
    } catch (error) {
      console.error("Report generation error:", error);
      addToast({
        type: "error",
        title: "Report Generation Failed",
        message: error.message || "Failed to generate report",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Database className="w-5 h-5 mr-2" />
          Data Backup & Export
        </h3>

        {/* Table Selection */}
        <div className="mb-6">
          <h4 className="font-medium mb-3">Select Tables to Export</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(selectedTables).map(([table, selected]) => (
              <label
                key={table}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => handleTableSelection(table)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium capitalize">
                  {table.replace("_", " ")}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Export Options */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => exportData("json")}
            disabled={isExporting}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? "Exporting..." : "Export JSON"}
          </button>

          <button
            onClick={() => exportData("csv")}
            disabled={isExporting}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText className="w-4 h-4 mr-2" />
            {isExporting ? "Exporting..." : "Export CSV"}
          </button>
        </div>
      </div>

      {/* Reports Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          Generate Reports
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">Sales Summary</h4>
            <p className="text-sm text-gray-600 mb-3">
              Monthly sales performance report
            </p>
            <button
              onClick={() => generateReport("sales_summary")}
              disabled={isExporting}
              className="w-full flex items-center justify-center px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Generate
            </button>
          </div>

          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">Inventory Report</h4>
            <p className="text-sm text-gray-600 mb-3">
              Current inventory status and analysis
            </p>
            <button
              onClick={() => generateReport("inventory_report")}
              disabled={isExporting}
              className="w-full flex items-center justify-center px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
            >
              <Database className="w-4 h-4 mr-2" />
              Generate
            </button>
          </div>

          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">Financial Report</h4>
            <p className="text-sm text-gray-600 mb-3">
              Annual financial performance analysis
            </p>
            <button
              onClick={() => generateReport("financial_report")}
              disabled={isExporting}
              className="w-full flex items-center justify-center px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
            >
              <FileText className="w-4 h-4 mr-2" />
              Generate
            </button>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <CheckCircle className="w-5 h-5 mr-2" />
          System Status
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 border rounded">
            <span className="text-sm font-medium">Database Connection</span>
            <span className="flex items-center text-green-600">
              <CheckCircle className="w-4 h-4 mr-1" />
              Connected
            </span>
          </div>

          <div className="flex items-center justify-between p-3 border rounded">
            <span className="text-sm font-medium">Last Backup</span>
            <span className="flex items-center text-gray-600">
              <Clock className="w-4 h-4 mr-1" />
              Manual backup required
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
