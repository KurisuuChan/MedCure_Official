import { useState } from "react";
import { format } from "date-fns";
import {
  BarChart3,
  TrendingUp,
  Package,
  AlertTriangle,
  FileText,
  Download,
  Calendar,
  Activity,
  Sparkles,
} from "lucide-react";
import { ReportsService } from "../../../services/domains/analytics/auditReportsService";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Currency formatter utility - PDF-safe version without special symbols
const formatCurrency = (amount) => {
  if (amount == null || isNaN(amount)) return "P 0.00";
  const formatted = Number(amount)
    .toFixed(2)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `P ${formatted}`;
};

// Utility to create helpful no-data messages
const createNoDataMessage = (dateRange, reportType = "sales") => {
  const { startDate, endDate } = dateRange;
  return (
    `📊 No ${reportType === "sales" ? "Sales" : "Financial"} Data Found\n\n` +
    `Date Range: ${startDate} to ${endDate}\n\n` +
    `Possible Solutions:\n` +
    `✓ Try "Last 7 days" or "Last 30 days" quick select button\n` +
    `✓ Check Transaction History to see when your sales occurred\n` +
    `✓ Adjust date range to include dates with actual sales\n` +
    `✓ Ensure sales are marked as "completed" in the system\n\n` +
    `💡 Tip: The system only includes completed transactions in reports`
  );
};

const AnalyticsReportsPage = () => {
  const [reports, setReports] = useState({
    inventory: null,
    sales: null,
    stockAlerts: null,
    performance: null,
  });

  const [loading, setLoading] = useState({
    inventory: false,
    sales: false,
    stockAlerts: false,
    performance: false,
  });

  // Date range states for reports
  const [salesDateRange, setSalesDateRange] = useState({
    startDate: format(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      "yyyy-MM-dd"
    ),
    endDate: format(new Date(), "yyyy-MM-dd"),
  });

  // Debug: Log current date range whenever it changes
  console.log("📅 [AnalyticsReportsPage] Current date range:", salesDateRange);

  // stock alert thresholds removed from UI — alerts are computed from server data

  // Generate Inventory Report
  const generateInventoryReport = async () => {
    setLoading((prev) => ({ ...prev, inventory: true }));
    try {
      const result = await ReportsService.generateInventoryReport();
      if (result.success && result.data) {
        setReports((prev) => ({
          ...prev,
          inventory: {
            totalProducts: result.data.summary.totalProducts,
            totalValue: result.data.summary.totalStockValue,
            totalCostValue: result.data.summary.totalCostValue || 0,
            lowStockCount: result.data.stockLevels.lowStock,
            outOfStock: result.data.stockLevels.outOfStock,
            normalStock: result.data.stockLevels.normalStock || 0,
            expiringItems: result.data.expiryAnalysis?.expiring30 || 0,
            expiredItems: result.data.expiryAnalysis?.expired || 0,
            topValueProducts: result.data.topValueProducts || [],
            categoryAnalysis: result.data.categoryAnalysis || [],
            fullData: result.data,
          },
        }));
        console.log("✅ Inventory report generated successfully!");
      } else {
        console.error(
          "❌",
          result.error || "Failed to generate inventory report"
        );
        alert(result.error || "Failed to generate inventory report");
      }
    } catch (error) {
      console.error("Error generating inventory report:", error);
      alert("An error occurred while generating the report");
    } finally {
      setLoading((prev) => ({ ...prev, inventory: false }));
    }
  };

  // Generate Sales Report
  const generateSalesReport = async () => {
    setLoading((prev) => ({ ...prev, sales: true }));
    try {
      console.log(
        "🔍 [AnalyticsReportsPage] Generating sales report for date range:",
        salesDateRange
      );
      const result = await ReportsService.generateSalesReport({
        startDate: new Date(salesDateRange.startDate).toISOString(),
        endDate: new Date(salesDateRange.endDate).toISOString(),
      });

      console.log("📊 [AnalyticsReportsPage] Sales report result:", result);
      if (result.success && result.data) {
        // Log the full report data for debugging
        console.log("📈 [AnalyticsReportsPage] Sales report data:", {
          totalTransactions: result.data.summary.totalTransactions,
          totalSales: result.data.summary.totalSales,
          totalCost: result.data.summary.totalCost,
          grossProfit: result.data.summary.grossProfit,
          profitMargin: result.data.summary.profitMargin,
        });

        // Check if there's actually any data
        if (result.data.summary.totalTransactions === 0) {
          console.warn(
            "⚠️ [AnalyticsReportsPage] No sales data found for selected date range"
          );
          alert(createNoDataMessage(salesDateRange, "sales"));
        }

        setReports((prev) => ({
          ...prev,
          sales: {
            totalRevenue: result.data.summary.totalSales,
            totalSales: result.data.summary.totalSales,
            totalCost: result.data.summary.totalCost,
            grossProfit: result.data.summary.grossProfit,
            profitMargin: result.data.summary.profitMargin,
            transactionCount: result.data.summary.totalTransactions,
            averageTransaction: result.data.summary.averageTransaction,
            averageCost: result.data.summary.averageCost,
            averageProfit: result.data.summary.averageProfit,
            topProducts: result.data.topProducts || [],
            categoryBreakdown: result.data.categoryBreakdown || [],
            dailyTrends: result.data.dailyTrends || [],
            fullData: result.data,
          },
        }));
        console.log("✅ Sales report generated successfully!");
      } else {
        console.error("❌", result.error || "Failed to generate sales report");
        alert(result.error || "Failed to generate sales report");
      }
    } catch (error) {
      console.error("Error generating sales report:", error);
      alert("An error occurred while generating the report");
    } finally {
      setLoading((prev) => ({ ...prev, sales: false }));
    }
  };

  // Generate Stock Alerts Report
  const generateStockAlertsReport = async () => {
    setLoading((prev) => ({ ...prev, stockAlerts: true }));
    try {
      const result = await ReportsService.generateInventoryReport();

      if (result.success && result.data) {
        const lowStockItems = result.data.lowStockAlerts || [];
        const outOfStockItems = result.data.stockLevels.outOfStock;
        const expiringItems = result.data.expiryAnalysis?.expiring30 || 0;

        setReports((prev) => ({
          ...prev,
          stockAlerts: {
            lowStockItems,
            outOfStockItems,
            expiringItems,
            fullData: result.data,
          },
        }));
        console.log("✅ Stock alerts report generated successfully!");
      } else {
        console.error(
          "❌",
          result.error || "Failed to generate stock alerts report"
        );
        alert(result.error || "Failed to generate stock alerts report");
      }
    } catch (error) {
      console.error("Error generating stock alerts report:", error);
      alert("An error occurred while generating the report");
    } finally {
      setLoading((prev) => ({ ...prev, stockAlerts: false }));
    }
  };

  // Generate Performance Report
  const generatePerformanceReport = async () => {
    setLoading((prev) => ({ ...prev, performance: true }));
    try {
      console.log(
        "🔍 [AnalyticsReportsPage] Generating performance report for date range:",
        salesDateRange
      );
      const result = await ReportsService.generateFinancialReport({
        startDate: new Date(salesDateRange.startDate).toISOString(),
        endDate: new Date(salesDateRange.endDate).toISOString(),
      });

      console.log(
        "📊 [AnalyticsReportsPage] Performance report result:",
        result
      );
      if (result.success && result.data) {
        // Log the full report data for debugging
        console.log("💰 [AnalyticsReportsPage] Performance report data:", {
          transactionCount: result.data.transactions.count,
          totalRevenue: result.data.revenue.total,
          totalCost: result.data.costs.total,
          grossProfit: result.data.profit.gross,
          profitMargin: result.data.profit.margin,
        });

        // Check if there's actually any data
        if (result.data.transactions.count === 0) {
          console.warn(
            "⚠️ [AnalyticsReportsPage] No financial data found for selected date range"
          );
          alert(createNoDataMessage(salesDateRange, "financial"));
        }

        setReports((prev) => ({
          ...prev,
          performance: {
            // Revenue metrics
            totalRevenue: result.data.revenue.total,
            dailyRevenue: result.data.revenue.daily,
            averageRevenue: result.data.revenue.average,

            // Cost metrics
            totalCost: result.data.costs.total,
            dailyCost: result.data.costs.daily,
            costPercentage: result.data.costs.percentage,

            // Profit metrics
            grossProfit: result.data.profit.gross,
            netProfit: result.data.profit.net,
            profitMargin: result.data.profit.margin,
            dailyProfit: result.data.profit.daily,
            roi: result.data.profit.roi,

            // Inventory metrics
            inventoryValue: result.data.inventory.currentValue,
            inventoryTurnover: result.data.inventory.turnover,
            daysInventory: result.data.inventory.daysInventory,

            // Transaction metrics
            transactionCount: result.data.transactions.count,
            averageTransaction: result.data.transactions.averageValue,
            dailyTransactions: result.data.transactions.dailyAverage,

            fullData: result.data,
          },
        }));
        console.log("✅ Performance report generated successfully!");
      } else {
        console.error(
          "❌",
          result.error || "Failed to generate performance report"
        );
        alert(result.error || "Failed to generate performance report");
      }
    } catch (error) {
      console.error("Error generating performance report:", error);
      alert("An error occurred while generating the report");
    } finally {
      setLoading((prev) => ({ ...prev, performance: false }));
    }
  };

  // Export to TXT
  const exportToTXT = (reportData, reportName) => {
    try {
      let txtContent = "";

      if (reportName.includes("stock_alerts")) {
        // Enhanced TXT format with detailed medication information
        const lowStockItems = Array.isArray(reportData.lowStockItems)
          ? reportData.lowStockItems
          : [];
        const outOfStockItems =
          reportData.fullData?.lowStockAlerts?.filter(
            (item) => item.stock_in_pieces === 0
          ) || [];
        const expiringItems =
          reportData.fullData?.expiryAnalysis?.expiringProducts || [];

        txtContent = "=".repeat(80) + "\n";
        txtContent += "STOCK ALERTS REPORT\n";
        txtContent += "MedCure Pharmacy\n";
        txtContent += `Generated: ${format(
          new Date(),
          "MMMM dd, yyyy HH:mm"
        )}\n`;
        txtContent += "=".repeat(80) + "\n\n";

        // Summary
        txtContent += "SUMMARY\n";
        txtContent += "-".repeat(80) + "\n";
        txtContent += `Low Stock Items:        ${lowStockItems.length}\n`;
        txtContent += `Out of Stock:           ${outOfStockItems.length}\n`;
        txtContent += `Expiring Soon (30d):    ${expiringItems.length}\n`;
        txtContent += `Total Alerts:           ${
          lowStockItems.length + outOfStockItems.length + expiringItems.length
        }\n\n`;

        // Low Stock Details
        if (lowStockItems.length > 0) {
          txtContent += "=".repeat(80) + "\n";
          txtContent += "⚠️  LOW STOCK MEDICATIONS\n";
          txtContent += "=".repeat(80) + "\n\n";
          lowStockItems.forEach((item, index) => {
            const currentStock = Number(item.stock_in_pieces) || 0;
            const reorderLevel = Number(item.reorder_level) || 10;
            const pricePerPiece = Number(item.price_per_piece) || 0;
            const stockValue = currentStock * pricePerPiece;
            const medName =
              item.brand_name || item.generic_name || "Unknown Medication";
            const shortage = Math.max(0, reorderLevel - currentStock);

            txtContent += `${index + 1}. ${medName}\n`;
            txtContent += `   Generic Name:    ${item.generic_name || "N/A"}\n`;
            txtContent += `   Brand Name:      ${item.brand_name || "N/A"}\n`;
            txtContent += `   Category:        ${item.category || "N/A"}\n`;
            txtContent += `   Manufacturer:    ${item.manufacturer || "N/A"}\n`;
            txtContent += `   Dosage Strength: ${
              item.dosage_strength || "N/A"
            }\n`;
            txtContent += `   Dosage Form:     ${item.dosage_form || "N/A"}\n`;
            txtContent += `   Current Stock:   ${currentStock} pieces\n`;
            txtContent += `   Reorder Level:   ${reorderLevel} pieces\n`;
            txtContent += `   Shortage:        ${shortage} pieces\n`;
            txtContent += `   Price per Piece: ₱${pricePerPiece.toFixed(2)}\n`;
            txtContent += `   Stock Value:     ₱${stockValue.toFixed(2)}\n`;
            txtContent += `   Supplier:        ${item.supplier || "N/A"}\n`;
            txtContent += `   Batch Number:    ${item.batch_number || "N/A"}\n`;
            if (item.expiry_date) {
              txtContent += `   Expiry Date:     ${format(
                new Date(item.expiry_date),
                "MMM dd, yyyy"
              )}\n`;
            }
            txtContent += "\n";
          });
        }

        // Out of Stock Details
        if (outOfStockItems.length > 0) {
          txtContent += "=".repeat(80) + "\n";
          txtContent += "🚨 OUT OF STOCK MEDICATIONS\n";
          txtContent += "=".repeat(80) + "\n\n";
          outOfStockItems.forEach((item, index) => {
            const reorderLevel = Number(item.reorder_level) || 10;
            const medName =
              item.brand_name || item.generic_name || "Unknown Medication";
            const urgency =
              reorderLevel > 50 ? "HIGH" : reorderLevel > 20 ? "MEDIUM" : "LOW";

            txtContent += `${index + 1}. ${medName}\n`;
            txtContent += `   Generic Name:    ${item.generic_name || "N/A"}\n`;
            txtContent += `   Brand Name:      ${item.brand_name || "N/A"}\n`;
            txtContent += `   Category:        ${item.category || "N/A"}\n`;
            txtContent += `   Manufacturer:    ${item.manufacturer || "N/A"}\n`;
            txtContent += `   Dosage Strength: ${
              item.dosage_strength || "N/A"
            }\n`;
            txtContent += `   Dosage Form:     ${item.dosage_form || "N/A"}\n`;
            txtContent += `   Current Stock:   0 pieces (OUT OF STOCK)\n`;
            txtContent += `   Reorder Level:   ${reorderLevel} pieces\n`;
            txtContent += `   Urgency Level:   ${urgency}\n`;
            txtContent += `   Supplier:        ${item.supplier || "N/A"}\n`;
            txtContent += `   Last Updated:    ${format(
              new Date(item.created_at || new Date()),
              "MMM dd, yyyy"
            )}\n`;
            if (item.expiry_date) {
              txtContent += `   Last Expiry:     ${format(
                new Date(item.expiry_date),
                "MMM dd, yyyy"
              )}\n`;
            }
            txtContent += `   Action Required: ORDER IMMEDIATELY\n\n`;
          });
        }

        // Expiring Soon Details
        if (expiringItems.length > 0) {
          txtContent += "=".repeat(80) + "\n";
          txtContent += "📅 MEDICATIONS EXPIRING SOON (30 DAYS)\n";
          txtContent += "=".repeat(80) + "\n\n";
          expiringItems.forEach((item, index) => {
            const expiryDate = new Date(item.expiry_date);
            const today = new Date();
            const daysUntilExpiry = Math.ceil(
              (expiryDate - today) / (1000 * 60 * 60 * 24)
            );

            const currentStock = Number(item.stock_in_pieces) || 0;
            const pricePerPiece = Number(item.price_per_piece) || 0;
            const stockValue = currentStock * pricePerPiece;
            const medName =
              item.brand_name || item.generic_name || "Unknown Medication";

            // Determine priority and recommended actions
            let priority = "LOW";
            let action = "Monitor closely";
            if (daysUntilExpiry <= 7) {
              priority = "CRITICAL";
              action = "URGENT: Discount/Return/Dispose immediately";
            } else if (daysUntilExpiry <= 15) {
              priority = "HIGH";
              action = "Consider discount pricing or return to supplier";
            } else if (daysUntilExpiry <= 30) {
              priority = "MEDIUM";
              action = "Promote sales or transfer to other locations";
            }

            txtContent += `${index + 1}. ${medName}\n`;
            txtContent += `   Generic Name:    ${item.generic_name || "N/A"}\n`;
            txtContent += `   Brand Name:      ${item.brand_name || "N/A"}\n`;
            txtContent += `   Category:        ${item.category || "N/A"}\n`;
            txtContent += `   Manufacturer:    ${item.manufacturer || "N/A"}\n`;
            txtContent += `   Dosage Strength: ${
              item.dosage_strength || "N/A"
            }\n`;
            txtContent += `   Dosage Form:     ${item.dosage_form || "N/A"}\n`;
            txtContent += `   Current Stock:   ${currentStock} pieces\n`;
            txtContent += `   Stock Value:     ₱${stockValue.toFixed(2)}\n`;
            txtContent += `   Batch Number:    ${item.batch_number || "N/A"}\n`;
            txtContent += `   Expiry Date:     ${format(
              expiryDate,
              "MMM dd, yyyy"
            )}\n`;
            txtContent += `   Days Until Exp:  ${daysUntilExpiry} days\n`;
            txtContent += `   Priority Level:  ${priority}\n`;
            txtContent += `   Recommended:     ${action}\n`;
            txtContent += `   Supplier:        ${item.supplier || "N/A"}\n\n`;
          });
        }

        txtContent += "=".repeat(80) + "\n";
        txtContent += "End of Report\n";
        txtContent += "=".repeat(80) + "\n";
      } else {
        // For other report types, use JSON format
        txtContent = JSON.stringify(reportData, null, 2);
      }

      const blob = new Blob([txtContent], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${reportName}_${format(new Date(), "yyyy-MM-dd")}.txt`;
      link.click();
      URL.revokeObjectURL(url);
      console.log(`✅ ${reportName} exported to TXT successfully!`);
    } catch (error) {
      console.error("Error exporting to TXT:", error);
      alert("Failed to export report to TXT");
    }
  };

  // Export to CSV
  const exportToCSV = async (reportData, reportName) => {
    try {
      let csvContent = "";

      // Determine report type and format CSV accordingly
      if (reportName.includes("inventory")) {
        csvContent = "Metric,Value\n";
        csvContent += `Total Products,${reportData.totalProducts || 0}\n`;
        csvContent += `Total Value,₱${(reportData.totalValue || 0).toFixed(
          2
        )}\n`;
        csvContent += `Low Stock Items,${reportData.lowStockCount || 0}\n`;
        csvContent += `Out of Stock,${reportData.outOfStock || 0}\n`;
      } else if (reportName.includes("sales")) {
        csvContent = "Metric,Value\n";
        csvContent += `Total Sales,₱${(reportData.totalSales || 0).toFixed(
          2
        )}\n`;
        csvContent += `Total Transactions,${
          reportData.transactionCount || 0
        }\n`;
        csvContent += `Average Transaction,₱${(
          reportData.averageTransaction || 0
        ).toFixed(2)}\n`;
      } else if (reportName.includes("stock_alerts")) {
        // Enhanced CSV with detailed medication information
        const lowStockItems = Array.isArray(reportData.lowStockItems)
          ? reportData.lowStockItems
          : [];
        const outOfStockItems =
          reportData.fullData?.lowStockAlerts?.filter(
            (item) => item.stock_in_pieces === 0
          ) || [];
        const expiringItems =
          reportData.fullData?.expiryAnalysis?.expiringProducts || [];

        csvContent = "Stock Alerts Summary Report\n";
        csvContent += `Generated: ${format(
          new Date(),
          "MMMM dd, yyyy HH:mm"
        )}\n\n`;

        // Summary section
        csvContent += "SUMMARY\n";
        csvContent += "Alert Type,Count\n";
        csvContent += `Low Stock Items,${lowStockItems.length}\n`;
        csvContent += `Out of Stock,${outOfStockItems.length}\n`;
        csvContent += `Expiring Soon (30 days),${expiringItems.length}\n`;
        csvContent += `Total Alerts,${
          lowStockItems.length + outOfStockItems.length + expiringItems.length
        }\n\n`;

        // Low Stock Details
        if (lowStockItems.length > 0) {
          csvContent += "LOW STOCK MEDICATIONS\n";
          csvContent +=
            "Medication Name,Generic Name,Brand Name,Category,Manufacturer,Dosage Strength,Dosage Form,Current Stock,Reorder Level,Shortage,Stock Value,Supplier,Batch Number,Expiry Date\n";
          lowStockItems.forEach((item) => {
            const currentStock = Number(item.stock_in_pieces) || 0;
            const reorderLevel = Number(item.reorder_level) || 10;
            const pricePerPiece = Number(item.price_per_piece) || 0;
            const stockValue = currentStock * pricePerPiece;
            const shortage = Math.max(0, reorderLevel - currentStock);

            csvContent += `"${item.brand_name || item.generic_name || "N/A"}",`;
            csvContent += `"${item.generic_name || "N/A"}",`;
            csvContent += `"${item.brand_name || "N/A"}",`;
            csvContent += `"${item.category || "N/A"}",`;
            csvContent += `"${item.manufacturer || "N/A"}",`;
            csvContent += `"${item.dosage_strength || "N/A"}",`;
            csvContent += `"${item.dosage_form || "N/A"}",`;
            csvContent += `${currentStock},`;
            csvContent += `${reorderLevel},`;
            csvContent += `${shortage},`;
            csvContent += `₱${stockValue.toFixed(2)},`;
            csvContent += `"${item.supplier || "N/A"}",`;
            csvContent += `"${item.batch_number || "N/A"}",`;
            csvContent += `"${
              item.expiry_date
                ? format(new Date(item.expiry_date), "MMM dd, yyyy")
                : "N/A"
            }"\n`;
          });
          csvContent += "\n";
        }

        // Out of Stock Details
        if (outOfStockItems.length > 0) {
          csvContent += "OUT OF STOCK MEDICATIONS\n";
          csvContent +=
            "Medication Name,Generic Name,Brand Name,Category,Manufacturer,Dosage Strength,Dosage Form,Reorder Level,Urgency Level,Supplier,Last Updated,Action Required\n";
          outOfStockItems.forEach((item) => {
            const reorderLevel = Number(item.reorder_level) || 10;
            const urgency =
              reorderLevel > 50 ? "HIGH" : reorderLevel > 20 ? "MEDIUM" : "LOW";

            csvContent += `"${item.brand_name || item.generic_name || "N/A"}",`;
            csvContent += `"${item.generic_name || "N/A"}",`;
            csvContent += `"${item.brand_name || "N/A"}",`;
            csvContent += `"${item.category || "N/A"}",`;
            csvContent += `"${item.manufacturer || "N/A"}",`;
            csvContent += `"${item.dosage_strength || "N/A"}",`;
            csvContent += `"${item.dosage_form || "N/A"}",`;
            csvContent += `${reorderLevel},`;
            csvContent += `"${urgency}",`;
            csvContent += `"${item.supplier || "N/A"}",`;
            csvContent += `"${format(
              new Date(item.created_at || new Date()),
              "MMM dd, yyyy"
            )}",`;
            csvContent += `"ORDER IMMEDIATELY"\n`;
          });
          csvContent += "\n";
        }

        // Expiring Soon Details
        if (expiringItems.length > 0) {
          csvContent += "MEDICATIONS EXPIRING SOON (30 DAYS)\n";
          csvContent +=
            "Medication Name,Generic Name,Brand Name,Category,Manufacturer,Dosage Strength,Dosage Form,Stock,Stock Value,Batch Number,Expiry Date,Days Until Expiry,Priority Level,Recommended Action,Supplier\n";
          expiringItems.forEach((item) => {
            const expiryDate = new Date(item.expiry_date);
            const today = new Date();
            const daysUntilExpiry = Math.ceil(
              (expiryDate - today) / (1000 * 60 * 60 * 24)
            );

            const currentStock = Number(item.stock_in_pieces) || 0;
            const pricePerPiece = Number(item.price_per_piece) || 0;
            const stockValue = currentStock * pricePerPiece;

            // Determine priority and recommended actions
            let priority = "LOW";
            let action = "Monitor closely";
            if (daysUntilExpiry <= 7) {
              priority = "CRITICAL";
              action = "URGENT: Discount/Return/Dispose immediately";
            } else if (daysUntilExpiry <= 15) {
              priority = "HIGH";
              action = "Consider discount pricing or return to supplier";
            } else if (daysUntilExpiry <= 30) {
              priority = "MEDIUM";
              action = "Promote sales or transfer to other locations";
            }

            csvContent += `"${item.brand_name || item.generic_name || "N/A"}",`;
            csvContent += `"${item.generic_name || "N/A"}",`;
            csvContent += `"${item.brand_name || "N/A"}",`;
            csvContent += `"${item.category || "N/A"}",`;
            csvContent += `"${item.manufacturer || "N/A"}",`;
            csvContent += `"${item.dosage_strength || "N/A"}",`;
            csvContent += `"${item.dosage_form || "N/A"}",`;
            csvContent += `${currentStock},`;
            csvContent += `₱${stockValue.toFixed(2)},`;
            csvContent += `"${item.batch_number || "N/A"}",`;
            csvContent += `"${format(expiryDate, "MMM dd, yyyy")}",`;
            csvContent += `${daysUntilExpiry},`;
            csvContent += `"${priority}",`;
            csvContent += `"${action}",`;
            csvContent += `"${item.supplier || "N/A"}"\n`;
          });
        }
      } else if (reportName.includes("performance")) {
        csvContent = "Metric,Value\n";
        csvContent += `Profit Margin,${(reportData.profitMargin || 0).toFixed(
          2
        )}%\n`;
        csvContent += `Inventory Turnover,${(
          reportData.inventoryTurnover || 0
        ).toFixed(2)}\n`;
        csvContent += `ROI,${(reportData.roi || 0).toFixed(2)}%\n`;
      }

      // Add BOM for UTF-8 encoding to ensure proper display of special characters (₱)
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${reportName}_${format(new Date(), "yyyy-MM-dd")}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      console.log(`✅ ${reportName} exported to CSV successfully!`);
    } catch (error) {
      console.error("Error exporting to CSV:", error);
      alert("Failed to export report to CSV");
    }
  };

  // Export to PDF - Professional and Modern Design
  const exportToPDF = (reportData, reportName) => {
    try {
      console.log("📊 [PDF Export] Starting export for:", reportName);
      console.log("📊 [PDF Export] Report data:", reportData);

      const doc = new jsPDF();

      // Set the document to use UTF-8 encoding for special characters
      doc.setLanguage("en-US");

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Professional color scheme (subtle, not flashy)
      const colors = {
        primary: [37, 99, 235], // Blue-600
        secondary: [107, 114, 128], // Gray-500
        success: [34, 197, 94], // Green-500
        warning: [234, 179, 8], // Yellow-500
        danger: [239, 68, 68], // Red-500
        text: [17, 24, 39], // Gray-900
        lightGray: [243, 244, 246], // Gray-100
      };

      // Header Section
      doc.setFillColor(...colors.primary);
      doc.rect(0, 0, pageWidth, 35, "F");

      // Company Logo/Name
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont(undefined, "bold");
      doc.text("MedCure Pharmacy", 14, 15);

      // Report Title
      doc.setFontSize(12);
      doc.setFont(undefined, "normal");
      const reportTitle = reportName.replace(/_/g, " ").toUpperCase();
      doc.text(reportTitle, 14, 25);

      // Generation Date
      doc.setFontSize(9);
      doc.text(
        `Generated: ${format(new Date(), "MMM dd, yyyy HH:mm")}`,
        pageWidth - 14,
        15,
        { align: "right" }
      );

      let yPosition = 45;

      // Report Content based on type
      if (reportName.includes("inventory")) {
        // Summary Section
        doc.setFillColor(...colors.lightGray);
        doc.rect(14, yPosition, pageWidth - 28, 8, "F");
        doc.setTextColor(...colors.text);
        doc.setFontSize(11);
        doc.setFont(undefined, "bold");
        doc.text("INVENTORY SUMMARY", 16, yPosition + 5.5);
        yPosition += 12;

        // Key Metrics in Grid
        const metrics = [
          ["Total Products", reportData.totalProducts || 0],
          ["Total Value", formatCurrency(reportData.totalValue || 0)],
          ["Low Stock Items", reportData.lowStockCount || 0],
          ["Out of Stock", reportData.outOfStock || 0],
          ["Normal Stock", reportData.normalStock || 0],
          ["Expiring Soon (30 days)", reportData.expiringItems || 0],
        ];

        autoTable(doc, {
          startY: yPosition,
          head: [["Metric", "Value"]],
          body: metrics,
          theme: "plain",
          headStyles: {
            fillColor: colors.primary,
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 10,
          },
          bodyStyles: {
            fontSize: 9,
            textColor: colors.text,
          },
          alternateRowStyles: {
            fillColor: colors.lightGray,
          },
          margin: { left: 14, right: 14 },
        });

        // Top Value Products Table
        if (
          reportData.topValueProducts &&
          reportData.topValueProducts.length > 0
        ) {
          console.log(
            "📊 [PDF Export] Top Value Products:",
            reportData.topValueProducts
          );
          yPosition = doc.lastAutoTable.finalY + 10;

          doc.setFillColor(...colors.lightGray);
          doc.rect(14, yPosition, pageWidth - 28, 8, "F");
          doc.setFontSize(11);
          doc.setFont(undefined, "bold");
          doc.text("TOP VALUE PRODUCTS", 16, yPosition + 5.5);
          yPosition += 10;

          const productData = reportData.topValueProducts
            .slice(0, 10)
            .map((p) => {
              const price = Number(p.price_per_piece) || 0;
              const stock = Number(p.stock_in_pieces) || 0;
              const totalValue = price * stock;
              console.log(
                "📊 [PDF Export] Processing product:",
                p.brand_name,
                "Price:",
                price,
                "Stock:",
                stock,
                "Total:",
                totalValue
              );
              return [
                p.brand_name || p.generic_name || "N/A",
                stock,
                formatCurrency(totalValue),
              ];
            });

          autoTable(doc, {
            startY: yPosition,
            head: [["Product Name", "Stock", "Total Value"]],
            body: productData,
            theme: "plain",
            headStyles: {
              fillColor: colors.primary,
              textColor: [255, 255, 255],
              fontStyle: "bold",
              fontSize: 9,
            },
            bodyStyles: {
              fontSize: 8,
              textColor: colors.text,
            },
            alternateRowStyles: {
              fillColor: colors.lightGray,
            },
            margin: { left: 14, right: 14 },
          });
        }
      } else if (reportName.includes("sales")) {
        // Summary Section
        doc.setFillColor(...colors.lightGray);
        doc.rect(14, yPosition, pageWidth - 28, 8, "F");
        doc.setTextColor(...colors.text);
        doc.setFontSize(11);
        doc.setFont(undefined, "bold");
        doc.text("SALES SUMMARY", 16, yPosition + 5.5);
        yPosition += 12;

        const metrics = [
          ["Total Sales", formatCurrency(reportData.totalSales || 0)],
          ["Total Transactions", reportData.transactionCount || 0],
          [
            "Average Transaction",
            formatCurrency(reportData.averageTransaction || 0),
          ],
          ["Total Cost", formatCurrency(reportData.totalCost || 0)],
          ["Gross Profit", formatCurrency(reportData.grossProfit || 0)],
          ["Profit Margin", `${(reportData.profitMargin || 0).toFixed(2)}%`],
        ];

        autoTable(doc, {
          startY: yPosition,
          head: [["Metric", "Value"]],
          body: metrics,
          theme: "plain",
          headStyles: {
            fillColor: colors.primary,
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 10,
          },
          bodyStyles: {
            fontSize: 9,
            textColor: colors.text,
          },
          alternateRowStyles: {
            fillColor: colors.lightGray,
          },
          margin: { left: 14, right: 14 },
        });

        yPosition = doc.lastAutoTable.finalY + 15;

        // ENHANCED SALES PERFORMANCE INSIGHTS
        doc.setFillColor(240, 249, 255); // Light blue background
        doc.rect(14, yPosition, pageWidth - 28, 8, "F");
        doc.setTextColor(30, 64, 175); // Blue text
        doc.setFontSize(11);
        doc.setFont(undefined, "bold");
        doc.text("SALES PERFORMANCE INSIGHTS", 16, yPosition + 5.5);
        yPosition += 12;

        // Calculate enhanced metrics
        const totalSales = reportData.totalSales || 0;
        const totalTransactions = reportData.transactionCount || 0;
        const totalCost = reportData.totalCost || 0;
        const grossProfit = reportData.grossProfit || 0;
        const profitMargin = reportData.profitMargin || 0;

        // Performance indicators
        const avgTransactionValue =
          totalTransactions > 0 ? totalSales / totalTransactions : 0;
        const costRatio = totalSales > 0 ? (totalCost / totalSales) * 100 : 0;
        const profitPerTransaction =
          totalTransactions > 0 ? grossProfit / totalTransactions : 0;

        // Determine performance status
        let performanceStatus = "Good";
        let performanceColor = [34, 197, 94]; // Green
        let salesRecommendations = [];

        if (profitMargin < 15) {
          performanceStatus = "Needs Improvement";
          performanceColor = [234, 179, 8]; // Orange
          salesRecommendations.push(
            "Profit margin below 15% - Review pricing strategy and cost management"
          );
        } else if (profitMargin < 25) {
          performanceStatus = "Fair";
          performanceColor = [59, 130, 246]; // Blue
          salesRecommendations.push(
            "Profit margin is acceptable but could be optimized"
          );
        } else {
          performanceStatus = "Excellent";
          salesRecommendations.push(
            "Strong profit margins - Maintain current pricing and cost strategies"
          );
        }

        if (avgTransactionValue < 200) {
          salesRecommendations.push(
            "Low average transaction value - Consider upselling and cross-selling strategies"
          );
        }

        if (totalTransactions < 10) {
          salesRecommendations.push(
            "Low transaction volume - Focus on customer acquisition and retention"
          );
        } else if (totalTransactions > 50) {
          salesRecommendations.push(
            "High transaction volume - Excellent customer engagement"
          );
        }

        // Performance insights table
        const performanceInsights = [
          ["Performance Status", performanceStatus],
          ["Cost Ratio", `${costRatio.toFixed(2)}%`],
          ["Profit per Transaction", formatCurrency(profitPerTransaction)],
          [
            "Revenue Efficiency",
            totalCost > 0
              ? `${((grossProfit / totalCost) * 100).toFixed(2)}% ROI`
              : "N/A",
          ],
        ];

        autoTable(doc, {
          startY: yPosition,
          head: [["Performance Indicator", "Value"]],
          body: performanceInsights,
          theme: "striped",
          headStyles: {
            fillColor: [30, 64, 175],
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 9,
          },
          bodyStyles: {
            fontSize: 8,
            textColor: colors.text,
          },
          alternateRowStyles: {
            fillColor: [240, 249, 255],
          },
          didParseCell: (data) => {
            // Color code the performance status
            if (data.column.index === 1 && data.row.index === 0) {
              data.cell.styles.textColor = performanceColor;
              data.cell.styles.fontStyle = "bold";
            }
          },
          margin: { left: 14, right: 14 },
        });

        yPosition = doc.lastAutoTable.finalY + 10;

        // Sales Recommendations Section
        if (salesRecommendations.length > 0) {
          doc.setFillColor(240, 253, 244); // Light green background
          doc.rect(14, yPosition, pageWidth - 28, 8, "F");
          doc.setTextColor(22, 163, 74); // Green text
          doc.setFontSize(11);
          doc.setFont(undefined, "bold");
          doc.text("SALES OPTIMIZATION RECOMMENDATIONS", 16, yPosition + 5.5);
          yPosition += 12;

          salesRecommendations.forEach((rec, index) => {
            doc.setFontSize(9);
            doc.setFont(undefined, "normal");
            doc.setTextColor(...colors.text);
            const recLines = doc.splitTextToSize(
              `${index + 1}. ${rec}`,
              pageWidth - 28
            );
            doc.text(recLines, 16, yPosition);
            yPosition += recLines.length * 4 + 2;
          });

          yPosition += 5;
        }

        // Top Selling Products
        if (reportData.topProducts && reportData.topProducts.length > 0) {
          yPosition = doc.lastAutoTable.finalY + 10;

          doc.setFillColor(...colors.lightGray);
          doc.rect(14, yPosition, pageWidth - 28, 8, "F");
          doc.setFontSize(11);
          doc.setFont(undefined, "bold");
          doc.text("TOP SELLING PRODUCTS", 16, yPosition + 5.5);
          yPosition += 10;

          const productData = reportData.topProducts
            .slice(0, 10)
            .map((p) => [
              p.name || p.productName || "N/A",
              p.quantity || p.quantitySold || 0,
              formatCurrency(p.revenue || 0),
            ]);

          autoTable(doc, {
            startY: yPosition,
            head: [["Product Name", "Qty Sold", "Revenue"]],
            body: productData,
            theme: "plain",
            headStyles: {
              fillColor: colors.primary,
              textColor: [255, 255, 255],
              fontStyle: "bold",
              fontSize: 9,
            },
            bodyStyles: {
              fontSize: 8,
              textColor: colors.text,
            },
            alternateRowStyles: {
              fillColor: colors.lightGray,
            },
            margin: { left: 14, right: 14 },
          });
        }
      } else if (reportName.includes("stock_alerts")) {
        // Summary Section
        doc.setFillColor(...colors.lightGray);
        doc.rect(14, yPosition, pageWidth - 28, 8, "F");
        doc.setTextColor(...colors.text);
        doc.setFontSize(11);
        doc.setFont(undefined, "bold");
        doc.text("STOCK ALERTS SUMMARY", 16, yPosition + 5.5);
        yPosition += 12;

        // Get proper counts from report data with clear differentiation
        const allLowStockAlerts = reportData.fullData?.lowStockAlerts || [];

        // Separate low stock (above 0, below reorder level) from out of stock (0 pieces)
        const actualLowStockItems = allLowStockAlerts.filter((item) => {
          const stock = Number(item.stock_in_pieces) || 0;
          return stock > 0; // Has stock but below reorder level
        });

        const outOfStockItems = allLowStockAlerts.filter((item) => {
          const stock = Number(item.stock_in_pieces) || 0;
          return stock === 0; // Completely out of stock
        });

        const expiringItems =
          reportData.fullData?.expiryAnalysis?.expiringProducts || [];

        const lowStockCount = actualLowStockItems.length;
        const outOfStockCount = outOfStockItems.length;
        const expiringCount = expiringItems.length;
        const totalAlerts = lowStockCount + outOfStockCount + expiringCount;

        console.log("📊 Stock Alert Summary Debug:", {
          allLowStockAlerts: allLowStockAlerts.length,
          actualLowStockItems: lowStockCount,
          outOfStockItems: outOfStockCount,
          expiringItems: expiringCount,
          totalAlerts,
        });

        const metrics = [
          ["Low Stock Medications (Above 0)", lowStockCount],
          ["Out of Stock Medications (Zero Stock)", outOfStockCount],
          ["Expiring Soon (30 days)", expiringCount],
          ["Total Critical Alerts", totalAlerts],
        ];

        autoTable(doc, {
          startY: yPosition,
          head: [["Alert Type", "Count"]],
          body: metrics,
          theme: "plain",
          headStyles: {
            fillColor: colors.warning,
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 10,
          },
          bodyStyles: {
            fontSize: 9,
            textColor: colors.text,
          },
          alternateRowStyles: {
            fillColor: colors.lightGray,
          },
          margin: { left: 14, right: 14 },
        });

        yPosition = doc.lastAutoTable.finalY + 15;

        // Add data quality notice after summary table
        doc.setFillColor(240, 249, 255); // Light blue background
        doc.rect(14, yPosition, pageWidth - 28, 12, "F");
        doc.setTextColor(30, 64, 175); // Blue text
        doc.setFontSize(9);
        doc.setFont(undefined, "normal");
        doc.text("DATA QUALITY NOTICE:", 16, yPosition + 4);
        doc.setFontSize(8);
        doc.text(
          "Fields showing 'Update Required' indicate missing medication details in your",
          16,
          yPosition + 7
        );
        doc.text(
          "inventory system. Consider updating product profiles for better tracking.",
          16,
          yPosition + 10
        );
        yPosition += 17;

        // LOW STOCK ITEMS DETAILS (excluding out of stock)
        if (actualLowStockItems.length > 0) {
          // Check if we need a new page
          if (yPosition > pageHeight - 60) {
            doc.addPage();
            yPosition = 20;
          }

          doc.setFillColor(255, 237, 213); // Warm orange background
          doc.rect(14, yPosition, pageWidth - 28, 8, "F");
          doc.setTextColor(...colors.warning);
          doc.setFontSize(11);
          doc.setFont(undefined, "bold");
          doc.text(
            "LOW STOCK MEDICATIONS (Above 0, Below Reorder Level)",
            16,
            yPosition + 5.5
          );
          yPosition += 10;

          const lowStockData = actualLowStockItems.map((item) => {
            // Safely extract values with proper fallbacks
            const currentStock = Number(item.stock_in_pieces) || 0;
            const reorderLevel = Number(item.reorder_level) || 10;
            const pricePerPiece = Number(item.price_per_piece) || 0;
            const stockValue = currentStock * pricePerPiece;

            // Use brand name first, then generic, then fallback
            const medName =
              item.brand_name && item.brand_name.trim()
                ? item.brand_name
                : item.generic_name && item.generic_name.trim()
                ? item.generic_name
                : "Unknown Medication";

            const category =
              item.category && item.category.trim()
                ? item.category
                : "Uncategorized";

            // Debug log to check what data we're actually getting
            console.log("🔍 PDF Generation - Raw item data:", {
              manufacturer: item.manufacturer,
              dosage_strength: item.dosage_strength,
              dosage_form: item.dosage_form,
              supplier: item.supplier,
            });

            const manufacturer =
              item.manufacturer && item.manufacturer.trim()
                ? item.manufacturer
                : "Not Specified";
            const dosageStrength =
              item.dosage_strength && item.dosage_strength.trim()
                ? item.dosage_strength
                : "Not Specified";
            const dosageForm =
              item.dosage_form && item.dosage_form.trim()
                ? item.dosage_form
                : "Not Specified";

            return [
              medName,
              category,
              `${currentStock} pcs`,
              `${reorderLevel} pcs`,
              formatCurrency(stockValue),
              manufacturer,
              `${dosageStrength} ${dosageForm}`.trim(),
            ];
          });

          autoTable(doc, {
            startY: yPosition,
            head: [
              [
                "Medication Name",
                "Category",
                "Current Stock",
                "Reorder Level",
                "Stock Value",
                "Manufacturer",
                "Dosage",
              ],
            ],
            body: lowStockData,
            theme: "striped",
            headStyles: {
              fillColor: colors.warning,
              textColor: [255, 255, 255],
              fontStyle: "bold",
              fontSize: 8,
            },
            bodyStyles: {
              fontSize: 7,
              textColor: colors.text,
            },
            alternateRowStyles: {
              fillColor: [255, 248, 240],
            },
            columnStyles: {
              0: { cellWidth: 45 }, // Medication Name
              1: { cellWidth: 25 }, // Category
              2: { cellWidth: 20, halign: "center", fontStyle: "bold" }, // Current Stock
              3: { cellWidth: 20, halign: "center" }, // Reorder Level
              4: { cellWidth: 25, halign: "right" }, // Stock Value
              5: { cellWidth: 30 }, // Manufacturer
              6: { cellWidth: 20, halign: "center" }, // Dosage
            },
            margin: { left: 14, right: 14 },
          });

          yPosition = doc.lastAutoTable.finalY + 15;
        }

        // OUT OF STOCK ITEMS DETAILS
        if (outOfStockItems.length > 0) {
          // Check if we need a new page
          if (yPosition > pageHeight - 60) {
            doc.addPage();
            yPosition = 20;
          }

          doc.setFillColor(254, 226, 226); // Light red background
          doc.rect(14, yPosition, pageWidth - 28, 8, "F");
          doc.setTextColor(...colors.danger);
          doc.setFontSize(11);
          doc.setFont(undefined, "bold");
          doc.text("OUT OF STOCK MEDICATIONS", 16, yPosition + 5.5);
          yPosition += 10;

          const outOfStockData = outOfStockItems.map((item) => {
            const reorderLevel = Number(item.reorder_level) || 10;

            // Use brand name first, then generic, then fallback
            const medName =
              item.brand_name && item.brand_name.trim()
                ? item.brand_name
                : item.generic_name && item.generic_name.trim()
                ? item.generic_name
                : "Unknown Medication";

            const category =
              item.category && item.category.trim()
                ? item.category
                : "Uncategorized";

            // Debug log to check what data we're actually getting for out of stock
            console.log("🔍 PDF Out of Stock - Raw item data:", {
              manufacturer: item.manufacturer,
              dosage_strength: item.dosage_strength,
              dosage_form: item.dosage_form,
              supplier: item.supplier,
            });

            const manufacturer =
              item.manufacturer && item.manufacturer.trim()
                ? item.manufacturer
                : "Not Specified";
            const dosageStrength =
              item.dosage_strength && item.dosage_strength.trim()
                ? item.dosage_strength
                : "Not Specified";
            const dosageForm =
              item.dosage_form && item.dosage_form.trim()
                ? item.dosage_form
                : "Not Specified";
            const supplier =
              item.supplier && item.supplier.trim()
                ? item.supplier
                : "Not Specified";

            const lastUpdated = item.created_at
              ? format(new Date(item.created_at), "MMM dd, yyyy")
              : item.updated_at
              ? format(new Date(item.updated_at), "MMM dd, yyyy")
              : "Unknown";
            const urgency =
              reorderLevel > 50 ? "High" : reorderLevel > 20 ? "Medium" : "Low";

            return [
              medName,
              category,
              `${reorderLevel} pcs`,
              lastUpdated,
              urgency,
              manufacturer,
              `${dosageStrength} ${dosageForm}`.trim(),
              supplier,
            ];
          });

          autoTable(doc, {
            startY: yPosition,
            head: [
              [
                "Medication Name",
                "Category",
                "Reorder Level",
                "Last Updated",
                "Urgency",
                "Manufacturer",
                "Dosage",
                "Supplier",
              ],
            ],
            body: outOfStockData,
            theme: "striped",
            headStyles: {
              fillColor: colors.danger,
              textColor: [255, 255, 255],
              fontStyle: "bold",
              fontSize: 8,
            },
            bodyStyles: {
              fontSize: 7,
              textColor: colors.text,
            },
            alternateRowStyles: {
              fillColor: [254, 242, 242],
            },
            columnStyles: {
              0: { cellWidth: 35 }, // Medication Name
              1: { cellWidth: 20 }, // Category
              2: { cellWidth: 15, halign: "center" }, // Reorder Level
              3: { cellWidth: 20, halign: "center" }, // Last Updated
              4: { cellWidth: 12, halign: "center", fontStyle: "bold" }, // Urgency
              5: { cellWidth: 25 }, // Manufacturer
              6: { cellWidth: 18, halign: "center" }, // Dosage
              7: { cellWidth: 20 }, // Supplier
            },
            margin: { left: 14, right: 14 },
          });

          yPosition = doc.lastAutoTable.finalY + 15;
        }

        // EXPIRING SOON ITEMS DETAILS
        if (expiringItems.length > 0) {
          // Check if we need a new page
          if (yPosition > pageHeight - 60) {
            doc.addPage();
            yPosition = 20;
          }

          doc.setFillColor(254, 249, 195); // Light yellow background
          doc.rect(14, yPosition, pageWidth - 28, 8, "F");
          doc.setTextColor(161, 98, 7); // Dark yellow
          doc.setFontSize(11);
          doc.setFont(undefined, "bold");
          doc.text("MEDICATIONS EXPIRING SOON (30 DAYS)", 16, yPosition + 5.5);
          yPosition += 10;

          const expiringData = expiringItems.map((item) => {
            const expiryDate = new Date(item.expiry_date);
            const today = new Date();
            const daysUntilExpiry = Math.ceil(
              (expiryDate - today) / (1000 * 60 * 60 * 24)
            );

            const currentStock = Number(item.stock_in_pieces) || 0;
            const stockValue =
              currentStock * (Number(item.price_per_piece) || 0);

            // Use brand name first, then generic, then fallback
            const medName =
              item.brand_name && item.brand_name.trim()
                ? item.brand_name
                : item.generic_name && item.generic_name.trim()
                ? item.generic_name
                : "Unknown Medication";

            const category =
              item.category && item.category.trim()
                ? item.category
                : "Uncategorized";
            const batchNumber =
              item.batch_number && item.batch_number.trim()
                ? item.batch_number
                : "Not Available";

            // Debug log to check what data we're actually getting for expiring items
            console.log("🔍 PDF Expiring - Raw item data:", {
              manufacturer: item.manufacturer,
              dosage_strength: item.dosage_strength,
              dosage_form: item.dosage_form,
              supplier: item.supplier,
            });

            const manufacturer =
              item.manufacturer && item.manufacturer.trim()
                ? item.manufacturer
                : "Not Specified";
            const dosageStrength =
              item.dosage_strength && item.dosage_strength.trim()
                ? item.dosage_strength
                : "Not Specified";
            const dosageForm =
              item.dosage_form && item.dosage_form.trim()
                ? item.dosage_form
                : "Not Specified";

            // Determine priority based on days left and stock value
            let priority = "Low";
            if (daysUntilExpiry <= 7) priority = "Critical";
            else if (daysUntilExpiry <= 15) priority = "High";
            else if (daysUntilExpiry <= 30) priority = "Medium";

            return [
              medName,
              category,
              manufacturer,
              `${dosageStrength} ${dosageForm}`.trim(),
              `${currentStock} pcs`,
              format(expiryDate, "MMM dd, yyyy"),
              `${daysUntilExpiry} days`,
              formatCurrency(stockValue),
              priority,
              batchNumber,
            ];
          });

          autoTable(doc, {
            startY: yPosition,
            head: [
              [
                "Medication Name",
                "Category",
                "Manufacturer",
                "Dosage",
                "Stock",
                "Expiry Date",
                "Days Left",
                "Stock Value",
                "Priority",
                "Batch #",
              ],
            ],
            body: expiringData,
            theme: "striped",
            headStyles: {
              fillColor: [161, 98, 7],
              textColor: [255, 255, 255],
              fontStyle: "bold",
              fontSize: 8,
            },
            bodyStyles: {
              fontSize: 7,
              textColor: colors.text,
            },
            alternateRowStyles: {
              fillColor: [254, 252, 232],
            },
            columnStyles: {
              0: { cellWidth: 35 }, // Medication Name
              1: { cellWidth: 18 }, // Category
              2: { cellWidth: 20 }, // Manufacturer
              3: { cellWidth: 15 }, // Dosage
              4: { cellWidth: 12, halign: "center" }, // Stock
              5: { cellWidth: 20, halign: "center" }, // Expiry Date
              6: { cellWidth: 15, halign: "center", fontStyle: "bold" }, // Days Left
              7: { cellWidth: 18, halign: "right" }, // Stock Value
              8: { cellWidth: 12, halign: "center", fontStyle: "bold" }, // Priority
              9: { cellWidth: 20, halign: "center" }, // Batch Number
            },
            margin: { left: 14, right: 14 },
          });

          yPosition = doc.lastAutoTable.finalY + 10;
        }

        // COMPREHENSIVE ANALYSIS SECTION
        if (yPosition > pageHeight - 80) {
          doc.addPage();
          yPosition = 20;
        }

        // Calculate comprehensive metrics
        const totalStockValue = [
          ...actualLowStockItems,
          ...outOfStockItems,
          ...expiringItems,
        ].reduce(
          (sum, item) =>
            sum + (item.stock_in_pieces || 0) * (item.price_per_piece || 0),
          0
        );

        const avgDaysToExpiry =
          expiringItems.length > 0
            ? expiringItems.reduce((sum, item) => {
                const expiryDate = new Date(item.expiry_date);
                const today = new Date();
                const days = Math.ceil(
                  (expiryDate - today) / (1000 * 60 * 60 * 24)
                );
                return sum + days;
              }, 0) / expiringItems.length
            : 0;

        const criticalValueAtRisk = expiringItems
          .filter((item) => {
            const expiryDate = new Date(item.expiry_date);
            const today = new Date();
            const days = Math.ceil(
              (expiryDate - today) / (1000 * 60 * 60 * 24)
            );
            return days <= 7;
          })
          .reduce(
            (sum, item) =>
              sum + (item.stock_in_pieces || 0) * (item.price_per_piece || 0),
            0
          );

        // FINANCIAL IMPACT ANALYSIS
        doc.setFillColor(254, 242, 242); // Light red background
        doc.rect(14, yPosition, pageWidth - 28, 8, "F");
        doc.setTextColor(220, 38, 38); // Red text
        doc.setFontSize(11);
        doc.setFont(undefined, "bold");
        doc.text("FINANCIAL IMPACT ANALYSIS", 16, yPosition + 5.5);
        yPosition += 12;

        const financialMetrics = [
          ["Total Value at Risk", formatCurrency(totalStockValue)],
          ["Critical Value (≤7 days)", formatCurrency(criticalValueAtRisk)],
          [
            "Out of Stock Revenue Loss",
            formatCurrency(
              outOfStockItems.reduce(
                (sum, item) =>
                  sum +
                  (item.reorder_level || 10) * (item.price_per_piece || 0),
                0
              )
            ),
          ],
          ["Average Days to Expiry", `${avgDaysToExpiry.toFixed(1)} days`],
        ];

        autoTable(doc, {
          startY: yPosition,
          head: [["Financial Metric", "Value"]],
          body: financialMetrics,
          theme: "plain",
          headStyles: {
            fillColor: [220, 38, 38],
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 9,
          },
          bodyStyles: {
            fontSize: 8,
            textColor: colors.text,
          },
          alternateRowStyles: {
            fillColor: [254, 242, 242],
          },
          margin: { left: 14, right: 14 },
        });

        yPosition = doc.lastAutoTable.finalY + 15;

        // OPERATIONAL INSIGHTS
        doc.setFillColor(240, 249, 255); // Light blue background
        doc.rect(14, yPosition, pageWidth - 28, 8, "F");
        doc.setTextColor(30, 64, 175); // Blue text
        doc.setFontSize(11);
        doc.setFont(undefined, "bold");
        doc.text("OPERATIONAL INSIGHTS & TRENDS", 16, yPosition + 5.5);
        yPosition += 12;

        // Category Analysis
        const categoryBreakdown = {};
        [...actualLowStockItems, ...outOfStockItems].forEach((item) => {
          const category = item.category || "Uncategorized";
          if (!categoryBreakdown[category]) {
            categoryBreakdown[category] = { count: 0, value: 0 };
          }
          categoryBreakdown[category].count++;
          categoryBreakdown[category].value +=
            (item.stock_in_pieces || 0) * (item.price_per_piece || 0);
        });

        const topAffectedCategories = Object.entries(categoryBreakdown)
          .sort((a, b) => b[1].count - a[1].count)
          .slice(0, 5);

        if (topAffectedCategories.length > 0) {
          const categoryData = topAffectedCategories.map(([category, data]) => [
            category,
            data.count,
            formatCurrency(data.value),
            `${(
              (data.count /
                (actualLowStockItems.length + outOfStockItems.length)) *
              100
            ).toFixed(1)}%`,
          ]);

          autoTable(doc, {
            startY: yPosition,
            head: [
              ["Most Affected Categories", "Items", "Value", "% of Issues"],
            ],
            body: categoryData,
            theme: "striped",
            headStyles: {
              fillColor: [30, 64, 175],
              textColor: [255, 255, 255],
              fontStyle: "bold",
              fontSize: 8,
            },
            bodyStyles: {
              fontSize: 7,
              textColor: colors.text,
            },
            alternateRowStyles: {
              fillColor: [240, 249, 255],
            },
            margin: { left: 14, right: 14 },
          });

          yPosition = doc.lastAutoTable.finalY + 15;
        }

        // Calculate action priorities with enhanced analysis
        const criticalActions = [];
        const urgentActions = [];
        const recommendedActions = [];

        if (outOfStockItems.length > 0) {
          const highDemandOOS = outOfStockItems.filter(
            (item) => (item.reorder_level || 10) > 20
          ).length;
          criticalActions.push(
            `${outOfStockItems.length} medications out of stock (${highDemandOOS} high-demand) - Place emergency orders, contact alternative suppliers`
          );
        }

        const criticalExpiring = expiringItems.filter((item) => {
          const expiryDate = new Date(item.expiry_date);
          const today = new Date();
          const daysUntilExpiry = Math.ceil(
            (expiryDate - today) / (1000 * 60 * 60 * 24)
          );
          return daysUntilExpiry <= 7;
        }).length;

        if (criticalExpiring > 0) {
          criticalActions.push(
            `${criticalExpiring} medications expire within 7 days - Implement emergency discount pricing (30-50% off) or return to supplier immediately`
          );
        }

        if (actualLowStockItems.length > 0) {
          const criticalLowStock = actualLowStockItems.filter(
            (item) =>
              (item.stock_in_pieces || 0) <=
              Math.max(1, (item.reorder_level || 10) * 0.3)
          ).length;
          urgentActions.push(
            `${actualLowStockItems.length} medications below reorder level (${criticalLowStock} critically low) - Schedule restocking within 48 hours`
          );
        }

        const highValueExpiring = expiringItems.filter((item) => {
          const stockValue =
            (Number(item.stock_in_pieces) || 0) *
            (Number(item.price_per_piece) || 0);
          const expiryDate = new Date(item.expiry_date);
          const today = new Date();
          const daysUntilExpiry = Math.ceil(
            (expiryDate - today) / (1000 * 60 * 60 * 24)
          );
          return stockValue > 5000 && daysUntilExpiry <= 15;
        }).length;

        if (highValueExpiring > 0) {
          urgentActions.push(
            `${highValueExpiring} high-value medications expiring - Contact supplier for return/exchange, promote through patient care programs`
          );
        }

        // Enhanced recommendations based on data patterns
        const supplierAnalysis = {};
        [...actualLowStockItems, ...outOfStockItems].forEach((item) => {
          const supplier = item.supplier || "Unknown Supplier";
          supplierAnalysis[supplier] = (supplierAnalysis[supplier] || 0) + 1;
        });

        const topProblematicSupplier = Object.entries(supplierAnalysis).sort(
          (a, b) => b[1] - a[1]
        )[0];

        if (topProblematicSupplier && topProblematicSupplier[1] > 2) {
          recommendedActions.push(
            `Supplier "${topProblematicSupplier[0]}" has ${topProblematicSupplier[1]} items with stock issues - Consider diversifying suppliers or renegotiating delivery terms`
          );
        }

        recommendedActions.push(
          "Implement automated reorder point system to prevent stockouts"
        );
        recommendedActions.push(
          "Establish FIFO rotation system for better expiry management"
        );
        recommendedActions.push(
          "Set up supplier performance monitoring dashboard"
        );

        const manufacturerIssues = [
          ...actualLowStockItems,
          ...outOfStockItems,
        ].filter(
          (item) => !item.manufacturer || item.manufacturer === "Not Specified"
        ).length;

        if (manufacturerIssues > 0) {
          recommendedActions.push(
            `Update manufacturer information for ${manufacturerIssues} items to improve supplier management`
          );
        }

        // PRIORITIZED ACTION PLAN
        doc.setFillColor(240, 253, 244); // Light green background
        doc.rect(14, yPosition, pageWidth - 28, 8, "F");
        doc.setTextColor(22, 163, 74); // Green text
        doc.setFontSize(11);
        doc.setFont(undefined, "bold");
        doc.text("PRIORITIZED ACTION PLAN", 16, yPosition + 5.5);
        yPosition += 12;

        // Create comprehensive action table with enhanced details
        const allActions = [
          ...criticalActions.map((action, index) => ({
            text: action,
            type: "🚨 CRITICAL",
            timeline: "IMMEDIATE",
            priority: index + 1,
            impact: "High Revenue Risk",
          })),
          ...urgentActions.map((action, index) => ({
            text: action,
            type: "⚠️ URGENT",
            timeline: "24-48 HOURS",
            priority: criticalActions.length + index + 1,
            impact: "Operations Impact",
          })),
          ...recommendedActions.slice(0, 4).map((action, index) => ({
            text: action,
            type: "💡 RECOMMENDATION",
            timeline: "THIS WEEK",
            priority: criticalActions.length + urgentActions.length + index + 1,
            impact: "Process Improvement",
          })),
        ];

        if (allActions.length === 0) {
          allActions.push({
            text: "No critical issues found. Maintain current inventory practices and consider implementing preventive measures.",
            type: "✅ STATUS",
            timeline: "ONGOING",
            priority: 1,
            impact: "Maintenance",
          });
        }

        const actionTableData = allActions.map((action) => [
          action.priority.toString(),
          action.type,
          action.timeline,
          action.impact,
          action.text,
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [
            [
              "#",
              "Priority Level",
              "Timeline",
              "Impact Type",
              "Action Required",
            ],
          ],
          body: actionTableData,
          theme: "grid",
          headStyles: {
            fillColor: [22, 163, 74],
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 8,
          },
          bodyStyles: {
            fontSize: 7,
            textColor: colors.text,
          },
          columnStyles: {
            0: { cellWidth: 8, halign: "center", fontStyle: "bold" }, // #
            1: { cellWidth: 22, fontStyle: "bold" }, // Priority Level
            2: { cellWidth: 20, halign: "center", fontStyle: "bold" }, // Timeline
            3: { cellWidth: 20, halign: "center" }, // Impact Type
            4: { cellWidth: 115 }, // Action Required
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252],
          },
          didParseCell: (data) => {
            // Color code the priority level column
            if (data.column.index === 1 && data.cell.text.length > 0) {
              const cellText = data.cell.text[0];
              if (cellText.includes("CRITICAL")) {
                data.cell.styles.textColor = [220, 38, 38]; // Red
                data.cell.styles.fillColor = [254, 242, 242]; // Light red background
              } else if (cellText.includes("URGENT")) {
                data.cell.styles.textColor = [234, 179, 8]; // Orange
                data.cell.styles.fillColor = [255, 251, 235]; // Light orange background
              } else if (cellText.includes("RECOMMENDATION")) {
                data.cell.styles.textColor = [34, 197, 94]; // Green
                data.cell.styles.fillColor = [240, 253, 244]; // Light green background
              }
            }
          },
          margin: { left: 14, right: 14 },
        });

        yPosition = doc.lastAutoTable.finalY + 15;

        // DATA IMPROVEMENT RECOMMENDATIONS
        if (yPosition > pageHeight - 50) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFillColor(250, 250, 250); // Light gray background
        doc.rect(14, yPosition, pageWidth - 28, 8, "F");
        doc.setTextColor(...colors.secondary);
        doc.setFontSize(11);
        doc.setFont(undefined, "bold");
        doc.text("DATA IMPROVEMENT RECOMMENDATIONS", 16, yPosition + 5.5);
        yPosition += 12;

        const improvementTips = [
          "Complete missing medication details (manufacturer, dosage strength, supplier)",
          "Add batch numbers for better traceability and expiry management",
          "Update supplier contact information for easier reordering",
          "Set appropriate reorder levels based on usage patterns",
          "Implement regular data quality checks and validation",
        ];

        improvementTips.forEach((tip, index) => {
          doc.setFontSize(9);
          doc.setFont(undefined, "normal");
          doc.setTextColor(...colors.text);
          doc.text(`${index + 1}. ${tip}`, 16, yPosition + index * 6);
        });

        yPosition += improvementTips.length * 6 + 10;
      } else if (reportName.includes("performance")) {
        // FINANCIAL PERFORMANCE OVERVIEW
        doc.setFillColor(240, 253, 244); // Light green background
        doc.rect(14, yPosition, pageWidth - 28, 8, "F");
        doc.setTextColor(22, 163, 74); // Green text
        doc.setFontSize(11);
        doc.setFont(undefined, "bold");
        doc.text("FINANCIAL PERFORMANCE OVERVIEW", 16, yPosition + 5.5);
        yPosition += 12;

        // Core financial metrics
        const totalRevenue = reportData.totalRevenue || 0;
        const totalCost = reportData.totalCost || 0;
        const grossProfit = reportData.grossProfit || 0;
        const profitMargin = reportData.profitMargin || 0;
        const roi = reportData.roi || 0;
        const transactionCount = reportData.transactionCount || 0;

        const coreMetrics = [
          ["Total Revenue", formatCurrency(totalRevenue)],
          ["Total Cost (COGS)", formatCurrency(totalCost)],
          ["Gross Profit", formatCurrency(grossProfit)],
          ["Profit Margin", `${profitMargin.toFixed(2)}%`],
          ["Return on Investment (ROI)", `${roi.toFixed(2)}%`],
          ["Total Transactions", transactionCount.toString()],
        ];

        autoTable(doc, {
          startY: yPosition,
          head: [["Financial Metric", "Value"]],
          body: coreMetrics,
          theme: "striped",
          headStyles: {
            fillColor: [22, 163, 74],
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 10,
          },
          bodyStyles: {
            fontSize: 9,
            textColor: colors.text,
          },
          alternateRowStyles: {
            fillColor: [240, 253, 244],
          },
          margin: { left: 14, right: 14 },
        });

        yPosition = doc.lastAutoTable.finalY + 15;

        // OPERATIONAL EFFICIENCY METRICS
        doc.setFillColor(240, 249, 255); // Light blue background
        doc.rect(14, yPosition, pageWidth - 28, 8, "F");
        doc.setTextColor(30, 64, 175); // Blue text
        doc.setFontSize(11);
        doc.setFont(undefined, "bold");
        doc.text("OPERATIONAL EFFICIENCY ANALYSIS", 16, yPosition + 5.5);
        yPosition += 12;

        const inventoryValue = reportData.inventoryValue || 0;
        const inventoryTurnover = reportData.inventoryTurnover || 0;
        const daysInventory = reportData.daysInventory || 0;
        const avgTransaction =
          transactionCount > 0 ? totalRevenue / transactionCount : 0;
        const dailyRevenue = reportData.dailyRevenue || 0;

        const operationalMetrics = [
          ["Inventory Value", formatCurrency(inventoryValue)],
          [
            "Inventory Turnover Ratio",
            `${inventoryTurnover.toFixed(2)}x per period`,
          ],
          ["Days Inventory Outstanding", `${daysInventory.toFixed(0)} days`],
          ["Average Transaction Value", formatCurrency(avgTransaction)],
          ["Daily Revenue Average", formatCurrency(dailyRevenue)],
          [
            "Cost Efficiency",
            totalRevenue > 0
              ? `${(((totalRevenue - totalCost) / totalRevenue) * 100).toFixed(
                  1
                )}%`
              : "N/A",
          ],
        ];

        autoTable(doc, {
          startY: yPosition,
          head: [["Operational Metric", "Value"]],
          body: operationalMetrics,
          theme: "striped",
          headStyles: {
            fillColor: [30, 64, 175],
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 10,
          },
          bodyStyles: {
            fontSize: 9,
            textColor: colors.text,
          },
          alternateRowStyles: {
            fillColor: [240, 249, 255],
          },
          margin: { left: 14, right: 14 },
        });

        yPosition = doc.lastAutoTable.finalY + 15;

        // PERFORMANCE BENCHMARKS & INSIGHTS
        doc.setFillColor(255, 251, 235); // Light yellow background
        doc.rect(14, yPosition, pageWidth - 28, 8, "F");
        doc.setTextColor(234, 179, 8); // Yellow text
        doc.setFontSize(11);
        doc.setFont(undefined, "bold");
        doc.text("PERFORMANCE BENCHMARKS & INSIGHTS", 16, yPosition + 5.5);
        yPosition += 12;

        // Performance analysis
        const performanceInsights = [];
        let overallRating = "Good";
        let ratingColor = [34, 197, 94]; // Green

        // Profit margin analysis
        if (profitMargin >= 30) {
          performanceInsights.push([
            "Profit Margin",
            "Excellent (≥30%)",
            "Maintain current pricing strategy",
          ]);
          overallRating = "Excellent";
        } else if (profitMargin >= 20) {
          performanceInsights.push([
            "Profit Margin",
            "Good (20-29%)",
            "Consider opportunities for optimization",
          ]);
        } else if (profitMargin >= 15) {
          performanceInsights.push([
            "Profit Margin",
            "Fair (15-19%)",
            "Review pricing and cost management",
          ]);
          overallRating = "Fair";
          ratingColor = [234, 179, 8]; // Yellow
        } else {
          performanceInsights.push([
            "Profit Margin",
            "Needs Improvement (<15%)",
            "Urgent: Review pricing and reduce costs",
          ]);
          overallRating = "Needs Improvement";
          ratingColor = [220, 38, 38]; // Red
        }

        // Inventory turnover analysis
        if (inventoryTurnover >= 12) {
          performanceInsights.push([
            "Inventory Turnover",
            "Excellent (≥12x/year)",
            "Efficient inventory management",
          ]);
        } else if (inventoryTurnover >= 6) {
          performanceInsights.push([
            "Inventory Turnover",
            "Good (6-11x/year)",
            "Room for improvement in turnover",
          ]);
        } else if (inventoryTurnover >= 3) {
          performanceInsights.push([
            "Inventory Turnover",
            "Fair (3-5x/year)",
            "Consider reducing stock levels",
          ]);
        } else {
          performanceInsights.push([
            "Inventory Turnover",
            "Poor (<3x/year)",
            "Review inventory levels and ordering",
          ]);
          if (overallRating === "Excellent" || overallRating === "Good") {
            overallRating = "Fair";
            ratingColor = [234, 179, 8];
          }
        }

        // ROI analysis
        if (roi >= 25) {
          performanceInsights.push([
            "ROI",
            "Excellent (≥25%)",
            "Strong return on investment",
          ]);
        } else if (roi >= 15) {
          performanceInsights.push([
            "ROI",
            "Good (15-24%)",
            "Solid investment returns",
          ]);
        } else if (roi >= 10) {
          performanceInsights.push([
            "ROI",
            "Fair (10-14%)",
            "Consider investment optimization",
          ]);
        } else {
          performanceInsights.push([
            "ROI",
            "Poor (<10%)",
            "Review investment strategy",
          ]);
        }

        autoTable(doc, {
          startY: yPosition,
          head: [["Performance Area", "Rating", "Recommendation"]],
          body: performanceInsights,
          theme: "grid",
          headStyles: {
            fillColor: [234, 179, 8],
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 9,
          },
          bodyStyles: {
            fontSize: 8,
            textColor: colors.text,
          },
          columnStyles: {
            0: { cellWidth: 40 }, // Performance Area
            1: { cellWidth: 35, fontStyle: "bold" }, // Rating
            2: { cellWidth: 110 }, // Recommendation
          },
          alternateRowStyles: {
            fillColor: [255, 251, 235],
          },
          margin: { left: 14, right: 14 },
        });

        yPosition = doc.lastAutoTable.finalY + 15;

        // OVERALL PERFORMANCE SUMMARY
        doc.setFillColor(248, 250, 252); // Light gray background
        doc.rect(14, yPosition, pageWidth - 28, 20, "F");
        doc.setTextColor(...ratingColor);
        doc.setFontSize(14);
        doc.setFont(undefined, "bold");
        doc.text(
          `OVERALL PERFORMANCE: ${overallRating.toUpperCase()}`,
          16,
          yPosition + 8
        );

        doc.setTextColor(...colors.text);
        doc.setFontSize(9);
        doc.setFont(undefined, "normal");
        const summaryText = `Based on profit margin (${profitMargin.toFixed(
          1
        )}%), ROI (${roi.toFixed(
          1
        )}%), and inventory turnover (${inventoryTurnover.toFixed(
          1
        )}x), your pharmacy shows ${overallRating.toLowerCase()} performance. Focus on areas rated as needing improvement for better results.`;
        const summaryLines = doc.splitTextToSize(summaryText, pageWidth - 32);
        doc.text(summaryLines, 16, yPosition + 14);

        yPosition += 25;
      }

      // Footer
      const footerY = pageHeight - 15;
      doc.setDrawColor(...colors.secondary);
      doc.setLineWidth(0.5);
      doc.line(14, footerY - 5, pageWidth - 14, footerY - 5);
      doc.setFontSize(8);
      doc.setTextColor(...colors.secondary);
      doc.setFont(undefined, "normal");
      doc.text("MedCure Pharmacy Management System", 14, footerY);
      doc.text(`Page 1 of 1`, pageWidth - 14, footerY, { align: "right" });

      // Save PDF
      doc.save(`${reportName}_${format(new Date(), "yyyy-MM-dd")}.pdf`);
      console.log(`✅ ${reportName} exported to PDF successfully!`);
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      alert("Failed to export report to PDF");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-2 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Analytics & Reports
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Generate comprehensive business insights and export data for
                  analysis.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-md">
              <Activity className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700 font-medium">
                Real-time data
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Report Configuration */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Report Configuration
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="config-start-date"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Start Date
            </label>
            <input
              id="config-start-date"
              type="date"
              value={salesDateRange.startDate}
              onChange={(e) =>
                setSalesDateRange((prev) => ({
                  ...prev,
                  startDate: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="config-end-date"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              End Date
            </label>
            <input
              id="config-end-date"
              type="date"
              value={salesDateRange.endDate}
              onChange={(e) =>
                setSalesDateRange((prev) => ({
                  ...prev,
                  endDate: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          {/* Low Stock Threshold input removed — thresholds are determined server-side */}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <span className="text-sm text-gray-600">Quick select:</span>
          <button
            onClick={() =>
              setSalesDateRange({
                startDate: format(
                  new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                  "yyyy-MM-dd"
                ),
                endDate: format(new Date(), "yyyy-MM-dd"),
              })
            }
            className="px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
          >
            Last 7 days
          </button>
          <button
            onClick={() =>
              setSalesDateRange({
                startDate: format(
                  new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                  "yyyy-MM-dd"
                ),
                endDate: format(new Date(), "yyyy-MM-dd"),
              })
            }
            className="px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
          >
            Last 30 days
          </button>
          <button
            onClick={() =>
              setSalesDateRange({
                startDate: format(
                  new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                  "yyyy-MM-dd"
                ),
                endDate: format(new Date(), "yyyy-MM-dd"),
              })
            }
            className="px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Inventory Analysis Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-2 rounded-lg">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  Inventory Analysis
                </h3>
                <p className="text-xs text-gray-500">
                  Stock levels, valuations & alerts
                </p>
              </div>
            </div>
          </div>
          <div className="p-4">
            <button
              onClick={generateInventoryReport}
              disabled={loading.inventory}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-md transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <BarChart3 className="h-4 w-4" />
              {loading.inventory ? "Generating..." : "Generate Report"}
            </button>

            {reports.inventory && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Total Products:</span>
                    <span className="font-semibold text-gray-900">
                      {reports.inventory.totalProducts || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Total Stock Value:</span>
                    <span className="font-semibold text-green-600">
                      ₱
                      {(reports.inventory.totalValue || 0).toLocaleString(
                        "en-PH",
                        { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                      )}
                    </span>
                  </div>
                  {reports.inventory.totalCostValue !== undefined && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Total Cost Value:</span>
                      <span className="font-semibold text-orange-600">
                        ₱
                        {(reports.inventory.totalCostValue || 0).toLocaleString(
                          "en-PH",
                          { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                        )}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Low Stock Items:</span>
                    <span className="font-semibold text-orange-600">
                      {reports.inventory.lowStockCount || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Out of Stock:</span>
                    <span className="font-semibold text-red-600">
                      {reports.inventory.outOfStock || 0}
                    </span>
                  </div>
                  {reports.inventory.normalStock !== undefined && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Normal Stock:</span>
                      <span className="font-semibold text-emerald-600">
                        {reports.inventory.normalStock || 0}
                      </span>
                    </div>
                  )}
                  {reports.inventory.expiringItems !== undefined && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">
                        Expiring Soon (30d):
                      </span>
                      <span className="font-semibold text-amber-600">
                        {reports.inventory.expiringItems || 0}
                      </span>
                    </div>
                  )}
                  {reports.inventory.expiredItems !== undefined && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Expired Items:</span>
                      <span className="font-semibold text-red-700">
                        {reports.inventory.expiredItems || 0}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      exportToTXT(reports.inventory, "inventory_report")
                    }
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-3 rounded-md transition-colors flex items-center justify-center gap-1.5 text-xs"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    TXT
                  </button>
                  <button
                    onClick={() =>
                      exportToCSV(reports.inventory, "inventory_report")
                    }
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-3 rounded-md transition-colors flex items-center justify-center gap-1.5 text-xs"
                  >
                    <Download className="h-3.5 w-3.5" />
                    CSV
                  </button>
                  <button
                    onClick={() =>
                      exportToPDF(reports.inventory, "inventory_report")
                    }
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-3 rounded-md transition-colors flex items-center justify-center gap-1.5 text-xs"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    PDF
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sales Analytics Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="bg-green-50 p-2 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  Sales Analytics
                </h3>
                <p className="text-xs text-gray-500">
                  Revenue trends & performance
                </p>
              </div>
            </div>
          </div>
          <div className="p-4">
            <button
              onClick={generateSalesReport}
              disabled={loading.sales}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-4 rounded-md transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <TrendingUp className="h-4 w-4" />
              {loading.sales ? "Generating..." : "Generate Report"}
            </button>

            {reports.sales && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
                {reports.sales.transactionCount === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-gray-600 mb-2">
                      📊 No sales data found for selected date range
                    </p>
                    <p className="text-xs text-gray-500">
                      Try selecting a different date range or make some sales
                      first.
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Current range: {salesDateRange.startDate} to{" "}
                      {salesDateRange.endDate}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Total Revenue:</span>
                        <span className="font-semibold text-green-600">
                          ₱
                          {(reports.sales.totalRevenue || 0).toLocaleString(
                            "en-PH",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">
                          Total Cost (COGS):
                        </span>
                        <span className="font-semibold text-orange-600">
                          ₱
                          {(reports.sales.totalCost || 0).toLocaleString(
                            "en-PH",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Gross Profit:</span>
                        <span className="font-semibold text-emerald-600">
                          ₱
                          {(reports.sales.grossProfit || 0).toLocaleString(
                            "en-PH",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Profit Margin:</span>
                        <span className="font-semibold text-purple-600">
                          {(reports.sales.profitMargin || 0).toFixed(2)}%
                        </span>
                      </div>
                      <div className="border-t border-gray-300 my-2"></div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">
                          Total Transactions:
                        </span>
                        <span className="font-semibold text-gray-900">
                          {reports.sales.transactionCount || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Avg Transaction:</span>
                        <span className="font-semibold text-blue-600">
                          ₱
                          {(
                            reports.sales.averageTransaction || 0
                          ).toLocaleString("en-PH", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">
                          Avg Cost/Transaction:
                        </span>
                        <span className="font-semibold text-amber-600">
                          ₱
                          {(reports.sales.averageCost || 0).toLocaleString(
                            "en-PH",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">
                          Avg Profit/Transaction:
                        </span>
                        <span className="font-semibold text-teal-600">
                          ₱
                          {(reports.sales.averageProfit || 0).toLocaleString(
                            "en-PH",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          exportToTXT(reports.sales, "sales_report")
                        }
                        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-3 rounded-md transition-colors flex items-center justify-center gap-1.5 text-xs"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        TXT
                      </button>
                      <button
                        onClick={() =>
                          exportToCSV(reports.sales, "sales_report")
                        }
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-3 rounded-md transition-colors flex items-center justify-center gap-1.5 text-xs"
                      >
                        <Download className="h-3.5 w-3.5" />
                        CSV
                      </button>
                      <button
                        onClick={() =>
                          exportToPDF(reports.sales, "sales_report")
                        }
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-3 rounded-md transition-colors flex items-center justify-center gap-1.5 text-xs"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        PDF
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stock Alerts Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="bg-orange-50 p-2 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  Stock Alerts
                </h3>
                <p className="text-xs text-gray-500">
                  Low inventory & reorder alerts
                </p>
              </div>
            </div>
          </div>
          <div className="p-4">
            <button
              onClick={generateStockAlertsReport}
              disabled={loading.stockAlerts}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2.5 px-4 rounded-md transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <AlertTriangle className="h-4 w-4" />
              {loading.stockAlerts ? "Generating..." : "Check Stock"}
            </button>

            {reports.stockAlerts && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Low Stock Items:</span>
                    <span className="font-semibold text-orange-600">
                      {Array.isArray(reports.stockAlerts.lowStockItems)
                        ? reports.stockAlerts.lowStockItems.length
                        : Number(reports.stockAlerts.lowStockItems) || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Out of Stock:</span>
                    <span className="font-semibold text-red-600">
                      {Array.isArray(reports.stockAlerts.outOfStockItems)
                        ? reports.stockAlerts.outOfStockItems.length
                        : Number(reports.stockAlerts.outOfStockItems) || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">
                      Expiring Soon (30 days):
                    </span>
                    <span className="font-semibold text-yellow-600">
                      {reports.stockAlerts.fullData?.expiryAnalysis
                        ?.expiringProducts?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Expired Items:</span>
                    <span className="font-semibold text-red-700">
                      {reports.stockAlerts.fullData?.expiryAnalysis
                        ?.expiredProducts?.length || 0}
                    </span>
                  </div>
                </div>

                {/* Show detailed breakdown if there are items */}
                {(reports.stockAlerts.lowStockItems?.length > 0 ||
                  reports.stockAlerts.fullData?.lowStockAlerts?.filter(
                    (item) => item.stock_in_pieces === 0
                  )?.length > 0 ||
                  reports.stockAlerts.fullData?.expiryAnalysis?.expiringProducts
                    ?.length > 0) && (
                  <div className="mt-3 p-3 bg-white rounded border">
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">
                      Critical Items Preview:
                    </h4>

                    {/* Preview of low stock items */}
                    {reports.stockAlerts.lowStockItems
                      ?.slice(0, 3)
                      .map((item, index) => (
                        <div key={index} className="text-xs text-gray-600 mb-1">
                          <span className="font-medium text-orange-600">
                            {item.brand_name || item.generic_name}
                          </span>
                          {" - "}
                          <span>
                            {item.stock_in_pieces} pcs remaining (need{" "}
                            {item.reorder_level})
                          </span>
                        </div>
                      ))}

                    {reports.stockAlerts.lowStockItems?.length > 3 && (
                      <div className="text-xs text-gray-500 italic">
                        ...and {reports.stockAlerts.lowStockItems.length - 3}{" "}
                        more items
                      </div>
                    )}

                    <div className="text-xs text-gray-500 mt-2">
                      📄 Generate full report for complete details and
                      recommendations
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      exportToTXT(reports.stockAlerts, "stock_alerts_report")
                    }
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-3 rounded-md transition-colors flex items-center justify-center gap-1.5 text-xs"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    TXT
                  </button>
                  <button
                    onClick={() =>
                      exportToCSV(reports.stockAlerts, "stock_alerts_report")
                    }
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-3 rounded-md transition-colors flex items-center justify-center gap-1.5 text-xs"
                  >
                    <Download className="h-3.5 w-3.5" />
                    CSV
                  </button>
                  <button
                    onClick={() =>
                      exportToPDF(reports.stockAlerts, "stock_alerts_report")
                    }
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-3 rounded-md transition-colors flex items-center justify-center gap-1.5 text-xs"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    PDF
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Performance Insights Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="bg-purple-50 p-2 rounded-lg">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  Performance Insights
                </h3>
                <p className="text-xs text-gray-500">
                  Profitability & turnover analysis
                </p>
              </div>
            </div>
          </div>
          <div className="p-4">
            <button
              onClick={generatePerformanceReport}
              disabled={loading.performance}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 px-4 rounded-md transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <BarChart3 className="h-4 w-4" />
              {loading.performance ? "Generating..." : "Analyze Performance"}
            </button>

            {reports.performance && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
                {reports.performance.transactionCount === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-gray-600 mb-2">
                      📊 No financial data found for selected date range
                    </p>
                    <p className="text-xs text-gray-500">
                      Try selecting a different date range or make some sales
                      first.
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Current range: {salesDateRange.startDate} to{" "}
                      {salesDateRange.endDate}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 mb-4">
                      {/* Revenue Section */}
                      <div className="font-semibold text-xs text-gray-700 uppercase mb-1">
                        Revenue Metrics
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Total Revenue:</span>
                        <span className="font-semibold text-green-600">
                          ₱
                          {(
                            reports.performance.totalRevenue || 0
                          ).toLocaleString("en-PH", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Daily Revenue:</span>
                        <span className="font-semibold text-green-500">
                          ₱
                          {(
                            reports.performance.dailyRevenue || 0
                          ).toLocaleString("en-PH", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>

                      {/* Profit Section */}
                      <div className="border-t border-gray-300 my-2"></div>
                      <div className="font-semibold text-xs text-gray-700 uppercase mb-1">
                        Profitability
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Gross Profit:</span>
                        <span className="font-semibold text-emerald-600">
                          ₱
                          {(
                            reports.performance.grossProfit || 0
                          ).toLocaleString("en-PH", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Profit Margin:</span>
                        <span className="font-semibold text-emerald-500">
                          {(reports.performance.profitMargin || 0).toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">ROI:</span>
                        <span className="font-semibold text-purple-600">
                          {(reports.performance.roi || 0).toFixed(2)}%
                        </span>
                      </div>

                      {/* Inventory Section */}
                      <div className="border-t border-gray-300 my-2"></div>
                      <div className="font-semibold text-xs text-gray-700 uppercase mb-1">
                        Inventory Efficiency
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Inventory Value:</span>
                        <span className="font-semibold text-blue-600">
                          ₱
                          {(
                            reports.performance.inventoryValue || 0
                          ).toLocaleString("en-PH", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Turnover Ratio:</span>
                        <span className="font-semibold text-blue-500">
                          {(reports.performance.inventoryTurnover || 0).toFixed(
                            2
                          )}
                          x
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Days Inventory:</span>
                        <span className="font-semibold text-indigo-600">
                          {(reports.performance.daysInventory || 0).toFixed(0)}{" "}
                          days
                        </span>
                      </div>

                      {/* Cost Section */}
                      <div className="border-t border-gray-300 my-2"></div>
                      <div className="font-semibold text-xs text-gray-700 uppercase mb-1">
                        Cost Analysis
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Total COGS:</span>
                        <span className="font-semibold text-orange-600">
                          ₱
                          {(reports.performance.totalCost || 0).toLocaleString(
                            "en-PH",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Cost Percentage:</span>
                        <span className="font-semibold text-orange-500">
                          {(reports.performance.costPercentage || 0).toFixed(2)}
                          %
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          exportToTXT(reports.performance, "performance_report")
                        }
                        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-3 rounded-md transition-colors flex items-center justify-center gap-1.5 text-xs"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        TXT
                      </button>
                      <button
                        onClick={() =>
                          exportToCSV(reports.performance, "performance_report")
                        }
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-3 rounded-md transition-colors flex items-center justify-center gap-1.5 text-xs"
                      >
                        <Download className="h-3.5 w-3.5" />
                        CSV
                      </button>
                      <button
                        onClick={() =>
                          exportToPDF(reports.performance, "performance_report")
                        }
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-3 rounded-md transition-colors flex items-center justify-center gap-1.5 text-xs"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        PDF
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Report Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Report Overview
          </h2>
        </div>
        <div className="space-y-3 mb-4">
          <div className="flex items-start gap-2 text-sm">
            <span className="text-blue-600 font-medium">•</span>
            <div>
              <span className="font-medium text-gray-900">
                Inventory Analysis:
              </span>
              <span className="text-gray-600 ml-1">
                Current stock levels, valuations & category insights
              </span>
            </div>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <span className="text-blue-600 font-medium">•</span>
            <div>
              <span className="font-medium text-gray-900">
                Sales Analytics:
              </span>
              <span className="text-gray-600 ml-1">
                Revenue trends, transaction patterns & top performers
              </span>
            </div>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <span className="text-blue-600 font-medium">•</span>
            <div>
              <span className="font-medium text-gray-900">Stock Alerts:</span>
              <span className="text-gray-600 ml-1">
                Low inventory warnings with reorder recommendations
              </span>
            </div>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <span className="text-blue-600 font-medium">•</span>
            <div>
              <span className="font-medium text-gray-900">
                Performance Insights:
              </span>
              <span className="text-gray-600 ml-1">
                Product profitability & turnover analysis
              </span>
            </div>
          </div>
        </div>
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Sparkles className="h-4 w-4 text-blue-500" />
            <span className="font-medium">Export formats:</span>
            <span>CSV for analysis • TXT for detailed reports</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
            <Activity className="h-4 w-4 text-green-500" />
            <span>Live data</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsReportsPage;
