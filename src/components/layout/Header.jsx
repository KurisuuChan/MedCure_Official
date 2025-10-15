import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { LogOut, Menu } from "lucide-react";
import NotificationBell from "../notifications/NotificationBell.jsx";
import NotificationErrorBoundary from "../notifications/NotificationErrorBoundary.jsx";
import { logger } from "../../utils/logger.js";

export function Header({ onToggleSidebar }) {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      logger.error("Error signing out:", error);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Mobile menu */}
          <div className="flex items-center">
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>

          {/* Right side - Notifications and User menu */}
          <div className="flex items-center space-x-4 ml-auto">
            {/* Notifications - New Database-Backed System with Error Boundary */}
            {user && (
              <NotificationErrorBoundary>
                <NotificationBell userId={user.id} />
              </NotificationErrorBoundary>
            )}

            {/* User menu */}
            <div className="relative">
              <div className="flex items-center space-x-3">
                <div className="hidden md:block text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {user?.first_name && user?.last_name
                      ? `${user.first_name} ${user.last_name}`
                      : user?.first_name ||
                        user?.email?.split("@")[0] ||
                        "User"}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">
                    {user?.role || "Cashier"}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {(user?.first_name ||
                        user?.email ||
                        "U")[0].toUpperCase()}
                    </span>
                  </div>

                  <button
                    onClick={handleSignOut}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                    title="Sign out"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
