import React from "react";
import {
  AlertTriangle,
  Archive,
  Bell,
  PackageX,
  Tag,
  UploadCloud,
  Clock,
  ShoppingCart,
} from "lucide-react";

// Centralized map for notification categories and their properties
export const NOTIFICATION_CONFIG = {
  low_stock: {
    label: "Low Stock",
    icon: <AlertTriangle className="text-yellow-500" />,
    accent: "border-l-4 border-yellow-400",
    bg: "bg-yellow-100",
  },
  no_stock: {
    label: "No Stock",
    icon: <PackageX className="text-red-500" />,
    accent: "border-l-4 border-red-500",
    bg: "bg-red-100",
  },
  expiring_soon: {
    label: "Expiring Soon",
    icon: <Clock className="text-orange-500" />,
    accent: "border-l-4 border-orange-400",
    bg: "bg-orange-100",
  },
  sale: {
    label: "Sales",
    icon: <ShoppingCart className="text-green-600" />,
    accent: "border-l-4 border-green-500",
    bg: "bg-green-100",
  },
  price_change: {
    label: "System",
    icon: <Tag className="text-blue-600" />,
    accent: "border-l-4 border-blue-400",
    bg: "bg-blue-100",
  },
  archive: {
    label: "System",
    icon: <Archive className="text-purple-500" />,
    accent: "border-l-4 border-blue-400",
    bg: "bg-blue-100",
  },
  unarchive: {
    label: "System",
    icon: <Archive className="text-purple-500" />,
    accent: "border-l-4 border-blue-400",
    bg: "bg-blue-100",
  },
  delete: {
    label: "System",
    icon: <Archive className="text-purple-500" />,
    accent: "border-l-4 border-blue-400",
    bg: "bg-blue-100",
  },
  upload: {
    label: "System",
    icon: <UploadCloud className="text-green-500" />,
    accent: "border-l-4 border-blue-400",
    bg: "bg-blue-100",
  },
  default: {
    label: "System",
    icon: <Bell className="text-gray-500" />,
    accent: "border-l-4 border-gray-300",
    bg: "bg-gray-100",
  },
};

export const getNotificationConfig = (type) => {
  return NOTIFICATION_CONFIG[type] || NOTIFICATION_CONFIG.default;
};
