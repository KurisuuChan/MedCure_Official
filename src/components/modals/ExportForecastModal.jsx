import React, { useState } from "react";
import { X, Download, FileText, FileJson, FileType } from "lucide-react";
import { useToast } from "../ui/Toast";

const ExportForecastModal = ({ isOpen, onClose, forecasts, summary }) => {
  const { success } = useToast();
  const [exportType, setExportType] = useState("forecast"); // forecast, summary
  const [exportFormat, setExportFormat] = useState("csv"); // csv, json, pdf
  const [filters, setFilters] = useState({
    demandLevel: "all",
    trendStatus: "all",
    reorderStatus: "all",
  });
  const [columns, setColumns] = useState({
    productName: true,
    category: true,
    demandLevel: true,
    trend: true,
    dailyAverage: true,
    currentStock: true,
    daysOfStock: true,
    reorderNeeded: true,
    suggestedQty: true,
    confidence: false,
    seasonality: false,
  });

  if (!isOpen) return null;

  const handleColumnToggle = (column) => {
    setColumns((prev) => ({ ...prev, [column]: !prev[column] }));
  };

  const getFilteredForecasts = () => {
    return forecasts.filter((f) => {
      const demandMatch =
        filters.demandLevel === "all" || f.demandLevel === filters.demandLevel;
      const trendMatch =
        filters.trendStatus === "all" || f.trend === filters.trendStatus;
      const reorderMatch =
        filters.reorderStatus === "all" ||
        (filters.reorderStatus === "needed" && f.reorderSuggestion?.shouldReorder) ||
        (filters.reorderStatus === "not-needed" && !f.reorderSuggestion?.shouldReorder);
      
      return demandMatch && trendMatch && reorderMatch;
    });
  };

  const exportToCSV = () => {
    const filtered = getFilteredForecasts();
    const selectedColumns = Object.entries(columns)
      .filter(([_, isSelected]) => isSelected)
      .map(([col]) => col);

    const headers = selectedColumns.map((col) => {
      const headerMap = {
        productName: "Product Name",
        category: "Category",
        demandLevel: "Demand Level",
        trend: "Trend",
        dailyAverage: "Daily Average",
        currentStock: "Current Stock",
        daysOfStock: "Days of Stock",
        reorderNeeded: "Reorder Needed",
        suggestedQty: "Suggested Quantity",
        confidence: "Confidence %",
        seasonality: "Seasonal",
      };
      return headerMap[col] || col;
    });

    const rows = filtered.map((f) => {
      return selectedColumns.map((col) => {
        switch (col) {
          case "productName":
            return f.productName;
          case "category":
            return f.category || "N/A";
          case "demandLevel":
            return f.demandLevel;
          case "trend":
            return f.trend;
          case "dailyAverage":
            return f.dailyAverage.toFixed(2);
          case "currentStock":
            return f.currentStock;
          case "daysOfStock":
            return f.daysOfStock?.toFixed(1) || "N/A";
          case "reorderNeeded":
            return f.reorderSuggestion?.shouldReorder ? "Yes" : "No";
          case "suggestedQty":
            return f.reorderSuggestion?.quantity || "N/A";
          case "confidence":
            return f.confidence ? `${(f.confidence * 100).toFixed(0)}%` : "N/A";
          case "seasonality":
            return f.seasonality?.hasSeasonal ? "Yes" : "No";
          default:
            return "N/A";
        }
      });
    });

    let csvContent = "";

    if (exportType === "summary") {
      csvContent = [
        `Sales Forecasting Summary Report`,
        `Generated: ${new Date().toLocaleString()}`,
        "",
        `Total Products,${summary?.totalProducts || 0}`,
        `High Demand Products,${summary?.highDemand || 0}`,
        `Medium Demand Products,${summary?.mediumDemand || 0}`,
        `Low Demand Products,${summary?.lowDemand || 0}`,
        `Growing Sales,${summary?.trending || 0}`,
        `Declining Sales,${summary?.declining || 0}`,
        `Need to Order,${summary?.needsReorder || 0}`,
        `Critical Stock,${summary?.criticalStock || 0}`,
        "",
        headers.join(","),
        ...rows.map((row) => row.join(",")),
      ].join("\n");
    } else {
      csvContent = [
        `Sales Forecasting Report`,
        `Generated: ${new Date().toLocaleString()}`,
        "",
        headers.join(","),
        ...rows.map((row) => row.join(",")),
      ].join("\n");
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sales-forecast-${exportType}-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    success("Forecast data exported successfully!");
    onClose();
  };

  const exportToJSON = () => {
    const filtered = getFilteredForecasts();
    const selectedColumns = Object.entries(columns)
      .filter(([_, isSelected]) => isSelected)
      .map(([col]) => col);

    const data = filtered.map((f) => {
      const obj = {};
      selectedColumns.forEach((col) => {
        switch (col) {
          case "productName":
            obj.productName = f.productName;
            break;
          case "category":
            obj.category = f.category || "N/A";
            break;
          case "demandLevel":
            obj.demandLevel = f.demandLevel;
            break;
          case "trend":
            obj.trend = f.trend;
            break;
          case "dailyAverage":
            obj.dailyAverage = f.dailyAverage;
            break;
          case "currentStock":
            obj.currentStock = f.currentStock;
            break;
          case "daysOfStock":
            obj.daysOfStock = f.daysOfStock;
            break;
          case "reorderNeeded":
            obj.reorderNeeded = f.reorderSuggestion?.shouldReorder || false;
            break;
          case "suggestedQty":
            obj.suggestedQuantity = f.reorderSuggestion?.quantity || 0;
            break;
          case "confidence":
            obj.confidence = f.confidence;
            break;
          case "seasonality":
            obj.seasonality = f.seasonality;
            break;
        }
      });
      return obj;
    });

    const jsonData = {
      exportDate: new Date().toISOString(),
      exportType,
      summary: exportType === "summary" ? summary : undefined,
      totalRecords: data.length,
      data,
    };

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
      type: "application/json",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sales-forecast-${exportType}-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    window.URL.revokeObjectURL(url);

    success("Forecast data exported as JSON!");
    onClose();
  };

  const exportToPDF = () => {
    const filtered = getFilteredForecasts();
    const printWindow = window.open("", "_blank");
    
    const selectedColumns = Object.entries(columns)
      .filter(([_, isSelected]) => isSelected)
      .map(([col]) => col);

    const headerMap = {
      productName: "Product",
      category: "Category",
      demandLevel: "Demand",
      trend: "Trend",
      dailyAverage: "Daily Avg",
      currentStock: "Stock",
      daysOfStock: "Days Left",
      reorderNeeded: "Reorder",
      suggestedQty: "Qty",
    };

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sales Forecasting Report</title>
          <style>
            @page { margin: 1cm; }
            body { 
              font-family: Arial, sans-serif; 
              font-size: 11px;
              margin: 0;
              padding: 20px;
            }
            h1 { 
              color: #1f2937; 
              border-bottom: 3px solid #3b82f6; 
              padding-bottom: 10px;
              margin-bottom: 10px;
              font-size: 24px;
            }
            .header-info {
              color: #6b7280;
              margin-bottom: 20px;
              font-size: 12px;
            }
            .summary { 
              background: #f3f4f6; 
              padding: 15px; 
              border-radius: 8px; 
              margin: 20px 0;
              page-break-inside: avoid;
            }
            .summary-grid { 
              display: grid; 
              grid-template-columns: repeat(4, 1fr); 
              gap: 15px;
            }
            .summary-card { text-align: center; }
            .summary-card .label { 
              font-size: 10px; 
              color: #6b7280; 
              text-transform: uppercase;
              margin-bottom: 5px;
            }
            .summary-card .value { 
              font-size: 20px; 
              font-weight: bold; 
              color: #1f2937;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 20px;
              font-size: 10px;
            }
            th { 
              background: #3b82f6; 
              color: white; 
              padding: 8px 6px; 
              text-align: left;
              font-size: 10px;
              font-weight: 600;
            }
            td { 
              padding: 6px; 
              border-bottom: 1px solid #e5e7eb;
            }
            tr:nth-child(even) { background: #f9fafb; }
            .high { color: #059669; font-weight: bold; }
            .medium { color: #d97706; font-weight: bold; }
            .low { color: #dc2626; font-weight: bold; }
            .trend-up { color: #059669; }
            .trend-down { color: #dc2626; }
            .footer { 
              margin-top: 30px; 
              text-align: center; 
              color: #6b7280; 
              font-size: 10px;
              border-top: 1px solid #e5e7eb;
              padding-top: 15px;
            }
            @media print {
              .no-print { display: none !important; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <h1>📊 Sales Forecasting Report</h1>
          <div class="header-info">
            <div>Generated: ${new Date().toLocaleString()}</div>
            <div>Total Records: ${filtered.length}</div>
            <div>Export Type: ${exportType === "summary" ? "Summary Report" : "Forecast Data"}</div>
          </div>
          
          ${exportType === "summary" ? `
          <div class="summary">
            <h3 style="margin-top: 0;">Summary Statistics</h3>
            <div class="summary-grid">
              <div class="summary-card">
                <div class="label">Total Products</div>
                <div class="value">${summary?.totalProducts || 0}</div>
              </div>
              <div class="summary-card">
                <div class="label">Best Sellers</div>
                <div class="value">${summary?.highDemand || 0}</div>
              </div>
              <div class="summary-card">
                <div class="label">Growing Sales</div>
                <div class="value">${summary?.trending || 0}</div>
              </div>
              <div class="summary-card">
                <div class="label">Need to Order</div>
                <div class="value">${summary?.needsReorder || 0}</div>
              </div>
            </div>
          </div>
          ` : ""}

          <table>
            <thead>
              <tr>
                ${selectedColumns.map((col) => `<th>${headerMap[col] || col}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${filtered
                .map((f) => {
                  return `<tr>${selectedColumns
                    .map((col) => {
                      let value = "";
                      let className = "";

                      switch (col) {
                        case "productName":
                          value = f.productName;
                          break;
                        case "category":
                          value = f.category || "N/A";
                          break;
                        case "demandLevel":
                          value = f.demandLevel;
                          className = f.demandLevel === "High" ? "high" : f.demandLevel === "Medium" ? "medium" : "low";
                          break;
                        case "trend":
                          value = f.trend;
                          className = f.trend === "Increasing" ? "trend-up" : f.trend === "Declining" ? "trend-down" : "";
                          break;
                        case "dailyAverage":
                          value = f.dailyAverage.toFixed(1);
                          break;
                        case "currentStock":
                          value = f.currentStock;
                          break;
                        case "daysOfStock":
                          value = f.daysOfStock?.toFixed(0) || "N/A";
                          break;
                        case "reorderNeeded":
                          value = f.reorderSuggestion?.shouldReorder ? "Yes" : "No";
                          break;
                        case "suggestedQty":
                          value = f.reorderSuggestion?.quantity || "-";
                          break;
                      }

                      return `<td class="${className}">${value}</td>`;
                    })
                    .join("")}</tr>`;
                })
                .join("")}
            </tbody>
          </table>

          <div class="footer">
            <p>MedCure Pharmacy Management System - Sales Forecasting Module</p>
            <button class="no-print" onclick="window.print()" style="margin-top: 15px; padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px;">
              🖨️ Print / Save as PDF
            </button>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    success("Print preview opened!");
    onClose();
  };

  const handleExport = () => {
    switch (exportFormat) {
      case "csv":
        exportToCSV();
        break;
      case "json":
        exportToJSON();
        break;
      case "pdf":
        exportToPDF();
        break;
      default:
        exportToCSV();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Download className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Export Sales Forecast</h2>
              <p className="text-sm text-gray-600">Download forecast data in your preferred format</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Export Type */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
              <FileText className="w-4 h-4" />
              Export Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setExportType("forecast")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  exportType === "forecast"
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <FileText className="w-5 h-5 mx-auto mb-2 text-green-600" />
                <div className="font-medium text-gray-900">Forecast Data</div>
                <div className="text-xs text-gray-500 mt-1">Detailed forecast report</div>
              </button>
              <button
                onClick={() => setExportType("summary")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  exportType === "summary"
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <FileType className="w-5 h-5 mx-auto mb-2 text-blue-600" />
                <div className="font-medium text-gray-900">Summary Report</div>
                <div className="text-xs text-gray-500 mt-1">With statistics</div>
              </button>
            </div>
          </div>

          {/* Export Format */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
              <FileJson className="w-4 h-4" />
              Export Format
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setExportFormat("csv")}
                className={`p-3 rounded-lg border-2 transition-all ${
                  exportFormat === "csv"
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="font-medium text-gray-900">CSV</div>
                <div className="text-xs text-gray-500">Excel Compatible</div>
              </button>
              <button
                onClick={() => setExportFormat("json")}
                className={`p-3 rounded-lg border-2 transition-all ${
                  exportFormat === "json"
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="font-medium text-gray-900">JSON</div>
                <div className="text-xs text-gray-500">Structured Data</div>
              </button>
              <button
                onClick={() => setExportFormat("pdf")}
                className={`p-3 rounded-lg border-2 transition-all ${
                  exportFormat === "pdf"
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="font-medium text-gray-900">PDF</div>
                <div className="text-xs text-gray-500">Print Ready</div>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-3 block">
              🔍 Filters
            </label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Demand Level</label>
                <select
                  value={filters.demandLevel}
                  onChange={(e) => setFilters({ ...filters, demandLevel: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">All Levels</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Trend Status</label>
                <select
                  value={filters.trendStatus}
                  onChange={(e) => setFilters({ ...filters, trendStatus: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">All Trends</option>
                  <option value="Increasing">Increasing</option>
                  <option value="Stable">Stable</option>
                  <option value="Declining">Declining</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Reorder Status</label>
                <select
                  value={filters.reorderStatus}
                  onChange={(e) => setFilters({ ...filters, reorderStatus: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">All Products</option>
                  <option value="needed">Need Reorder</option>
                  <option value="not-needed">No Reorder</option>
                </select>
              </div>
            </div>
          </div>

          {/* Columns to Export */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-3 block">
              ✓ Columns to Export
            </label>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(columns).map(([key, value]) => (
                <label
                  key={key}
                  className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={() => handleColumnToggle(key)}
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">
                    {key
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^./, (str) => str.toUpperCase())}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Preview Count */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-sm text-blue-800">
              <strong>{getFilteredForecasts().length}</strong> products will be exported
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-medium"
          >
            <Download className="w-4 h-4" />
            Export Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportForecastModal;
