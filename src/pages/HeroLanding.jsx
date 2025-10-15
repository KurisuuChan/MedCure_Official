import React from "react";
import HeroSection from "../components/ui/HeroSection";
import { Package, Box, Layers } from "lucide-react";

export default function HeroLanding() {
  const features = [
    {
      icon: <Package className="h-4 w-4" />,
      title: "Real-time Inventory",
      description:
        "Live stock tracking with automatic deduction and batch management.",
    },
    {
      icon: <Layers className="h-4 w-4" />,
      title: "Smart Notifications",
      description:
        "Intelligent alerts for low stock, expiring products, and critical events.",
    },
    {
      icon: <Box className="h-4 w-4" />,
      title: "Professional POS",
      description:
        "Complete transaction processing with discounts, receipts, and analytics.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <HeroSection
        title={
          <span>MedCure Pro — Professional Pharmacy Management System</span>
        }
        subtitle={
          <>
            Enterprise-grade POS and inventory management system specifically
            designed for pharmaceutical operations. Real-time tracking, batch
            management, intelligent notifications, and comprehensive reporting.
          </>
        }
        features={features}
        primaryCta={{ label: "Get started", href: "/inventory" }}
        secondaryCta={{ label: "Learn more", href: "/learn-more" }}
        illustration={"/Preview.png"}
      />

      <div
        id="features"
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
      >
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Why MedCure Pro?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h4 className="font-semibold mb-2">Batch & Expiry Tracking</h4>
            <p className="text-sm text-gray-600">
              Complete batch management with lot numbers, expiry dates, and FIFO
              support. Never sell expired stock with automated alerts.
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h4 className="font-semibold mb-2">Smart CSV Import</h4>
            <p className="text-sm text-gray-600">
              Intelligent bulk import with auto-creation of categories and
              dosage forms. Medicine-specific validation ensures data accuracy.
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h4 className="font-semibold mb-2">Built for Pharmacies</h4>
            <p className="text-sm text-gray-600">
              PWD/Senior discounts, transaction history, customer management,
              and professional receipt generation built-in.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
