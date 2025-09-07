import React, { useState } from "react";
import {
  CheckCircle,
  Package,
  ShoppingCart,
  Activity,
  BarChart3,
  Settings,
  TestTube,
  Zap,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { StockMovementManager } from "../components/StockMovementManager";
import { SalesProcessingValidator } from "../components/SalesProcessingValidator";

export const SystemTesting = () => {
  const [activeTest, setActiveTest] = useState("overview");

  const testSections = [
    {
      id: "overview",
      title: "System Overview",
      icon: BarChart3,
      description: "Complete system status and feature checklist",
    },
    {
      id: "stock",
      title: "Stock Management",
      icon: Package,
      description: "Test stock movements and variant tracking",
    },
    {
      id: "sales",
      title: "Sales Processing",
      icon: ShoppingCart,
      description: "Validate sales with variant calculations",
    },
    {
      id: "pos",
      title: "POS System",
      icon: Zap,
      description: "Test point of sale functionality",
    },
  ];

  const completedFeatures = [
    {
      feature: "Database Schema with Variants",
      status: "completed",
      description:
        "Products table updated with unit_type, pieces_per_box, pieces_per_sheet, box_price, sheet_price",
    },
    {
      feature: "Product Variant Management",
      status: "completed",
      description:
        "ProductModal enhanced with variant configuration and auto-price calculation",
    },
    {
      feature: "POS Variant Support",
      status: "completed",
      description:
        "POS.jsx completely rewritten with variant selection and pricing",
    },
    {
      feature: "GCash Payment Integration",
      status: "completed",
      description: "Replaced card payments with GCash throughout the system",
    },
    {
      feature: "Barcode System Removal",
      status: "completed",
      description: "Removed all barcode-related features as requested",
    },
    {
      feature: "Inventory Management Display",
      status: "completed",
      description:
        "Updated Management.jsx to show variant information instead of barcode data",
    },
    {
      feature: "Stock Movement Tracking",
      status: "completed",
      description: "Comprehensive stock movement manager with variant support",
    },
    {
      feature: "Database Functions",
      status: "completed",
      description:
        "RPC functions: add_stock, deduct_stock, process_sale, get_product_variants",
    },
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Medcure Pharmacy System - Development Complete
        </h2>
        <p className="text-muted-foreground">
          All requested features have been implemented and integrated.
        </p>
      </div>

      <div className="grid gap-4">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Feature Completion Status
          </h3>

          <div className="space-y-4">
            {completedFeatures.map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
              >
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-green-900 dark:text-green-100">
                    {item.feature}
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    {item.description}
                  </p>
                </div>
                <Badge variant="success" className="ml-auto">
                  ✓ Complete
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">System Components</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Frontend Components</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✓ POS.jsx - Variant-enabled point of sale</li>
                <li>✓ ProductModal.jsx - Variant configuration</li>
                <li>✓ Management.jsx - Inventory management</li>
                <li>✓ StockMovementManager.jsx - Stock tracking</li>
                <li>✓ SalesProcessingValidator.jsx - System testing</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Database Functions</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✓ add_stock() - Variant-aware stock addition</li>
                <li>✓ deduct_stock() - Stock deduction with variants</li>
                <li>✓ process_sale() - Complete sales processing</li>
                <li>✓ get_product_variants() - Variant data retrieval</li>
              </ul>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            Variant System Features
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Package className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <h4 className="font-medium">Piece Variant</h4>
              <p className="text-sm text-muted-foreground">
                Individual unit sales
              </p>
            </div>

            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <Package className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <h4 className="font-medium">Box Variant</h4>
              <p className="text-sm text-muted-foreground">Bulk box sales</p>
            </div>

            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Package className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <h4 className="font-medium">Sheet Variant</h4>
              <p className="text-sm text-muted-foreground">Sheet-based sales</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTest) {
      case "overview":
        return renderOverview();
      case "stock":
        return <StockMovementManager />;
      case "sales":
        return <SalesProcessingValidator />;
      case "pos":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                POS System Testing
              </h2>
              <p className="text-muted-foreground mb-4">
                Test the point of sale system with variant support.
              </p>
            </div>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                POS Features Implemented
              </h3>

              <div className="grid gap-4">
                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>
                    Variant selection (piece, box, sheet) for each product
                  </span>
                </div>

                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Automatic price calculation based on variant type</span>
                </div>

                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>
                    GCash payment integration (replaces card payments)
                  </span>
                </div>

                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Stock validation and automatic deduction</span>
                </div>

                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Complete barcode system removal</span>
                </div>
              </div>

              <div className="mt-6">
                <Button
                  onClick={() => (window.location.href = "/pos")}
                  className="w-full"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Test POS System
                </Button>
              </div>
            </Card>
          </div>
        );
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="sticky top-6">
              <Card className="p-4">
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <TestTube className="h-5 w-5" />
                  System Testing
                </h2>

                <nav className="space-y-2">
                  {testSections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveTest(section.id)}
                      className={`w-full text-left p-3 rounded-md transition-colors ${
                        activeTest === section.id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <section.icon className="h-4 w-4" />
                        <span className="font-medium">{section.title}</span>
                      </div>
                      <p className="text-xs opacity-75">
                        {section.description}
                      </p>
                    </button>
                  ))}
                </nav>
              </Card>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">{renderContent()}</div>
        </div>
      </div>
    </div>
  );
};
