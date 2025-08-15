import React from "react";
import {
  AlertTriangle,
  Archive,
  Bell,
  PackageX,
  Tag,
  UploadCloud,
  Clock,          // ADDED
  ShoppingCart,   // ADDED
} from "lucide-react";

// This now matches the labels defined in useNotifications.jsx
export const getAccentClass = (category) => {
  switch (category) {
    case "Low Stock":
      return "border-l-4 border-yellow-400";
    case "No Stock":
      return "border-l-4 border-red-500";
    case "Expiring Soon":            // ADDED
      return "border-l-4 border-orange-400";
    case "Sales":                    // ADDED
      return "border-l-4 border-green-500";
    case "System":
      return "border-l-4 border-gray-300";
    default:
      return "border-l-4 border-blue-400";
  }
};

export const getIconBgClass = (category) => {
  switch (category) {
    case "Low Stock":
      return "bg-yellow-100";
    case "No Stock":
      return "bg-red-100";
    case "Expiring Soon":            // ADDED
      return "bg-orange-100";
    case "Sales":                    // ADDED
      return "bg-green-100";
    case "System":
      return "bg-blue-100";
    default:
      return "bg-gray-100";
  }
};

// This uses `type` from the database, which is correct
export const iconForType = (type) => {
  switch (type) {
    case "upload":
      return <UploadCloud className="text-green-500" />;
    case "archive":
    case "unarchive":
    case "delete":
      return <Archive className="text-purple-500" />;
    case "price_change":
      return <Tag className="text-blue-600" />;
    case "low_stock":
      return <AlertTriangle className="text-yellow-500" />;
    case "no_stock":
      return <PackageX className="text-red-500" />;
    case "expiring_soon":                // ADDED
      return <Clock className="text-orange-500" />;
    case "sale":                         // ADDED
      return <ShoppingCart className="text-green-600" />;
    default:
      return <Bell className="text-gray-500" />;
  }
};
