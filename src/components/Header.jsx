import React, { useState, useEffect, useCallback, useRef } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { supabase } from "@/supabase/client";
import {
  Search,
  Bell,
  User,
  ChevronDown,
  LogOut,
  AlertTriangle,
  X,
  PackageX,
  UploadCloud,
} from "lucide-react";

// Helper functions for local storage moved outside the component
const getStoredJson = (key) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error(`Failed to parse ${key} from localStorage`, e);
    return null;
  }
};

const setStoredJson = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const getReadNotificationIds = () => getStoredJson("readNotificationIds") || [];
const setReadNotificationIds = (ids) =>
  setStoredJson("readNotificationIds", ids);

const getDismissedNotificationIds = () =>
  getStoredJson("dismissedNotificationIds") || [];
const setDismissedNotificationIds = (ids) =>
  setStoredJson("dismissedNotificationIds", ids);

const getLowStockTimestamps = () => getStoredJson("lowStockTimestamps") || {};
const setLowStockTimestamps = (timestamps) =>
  setStoredJson("lowStockTimestamps", timestamps);

// Moved TabButton outside of the Header component
const TabButton = ({ category, activeCategory, setActiveCategory }) => (
  <button
    onClick={() => setActiveCategory(category)}
    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
      activeCategory === category
        ? "bg-white text-gray-800 shadow-sm font-semibold"
        : "text-gray-500 hover:bg-gray-200 hover:text-gray-700"
    }`}
  >
    {category}
  </button>
);

// Added prop validation for the new TabButton component
TabButton.propTypes = {
  category: PropTypes.string.isRequired,
  activeCategory: PropTypes.string.isRequired,
  setActiveCategory: PropTypes.func.isRequired,
};

const Header = ({ handleLogout, user }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");

  const notificationsRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target)
      ) {
        setNotificationsOpen(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    const { data: products, error } = await supabase
      .from("products")
      .select("id, name, quantity, expireDate, status")
      .in("status", ["Available", "Unavailable"]);

    if (error) {
      console.error("Error fetching products for notifications:", error);
      setLoading(false);
      return;
    }

    const readIds = getReadNotificationIds();
    const dismissedIds = getDismissedNotificationIds();
    const lowStockTimestamps = getLowStockTimestamps();
    let newTimestamps = { ...lowStockTimestamps };
    let timestampsUpdated = false;

    const lowStockThreshold = 10;
    const today = new Date();
    let generatedNotifications = [];

    // Check for CSV import notification
    const csvImportData = getStoredJson("csvImported");
    if (csvImportData) {
      generatedNotifications.push({
        id: `csv-${csvImportData.timestamp}`,
        icon: <UploadCloud className="text-green-500" />,
        iconBg: "bg-green-100",
        title: "CSV Import Successful",
        category: "System",
        description: `${csvImportData.count} products were successfully imported.`,
        read: readIds.includes(`csv-${csvImportData.timestamp}`),
        path: "/management",
        createdAt: new Date(csvImportData.timestamp),
      });
      localStorage.removeItem("csvImported");
    }

    products.forEach((product) => {
      const lowStockId = `low-${product.id}`;
      if (product.quantity <= lowStockThreshold && product.quantity > 0) {
        let timestamp = newTimestamps[lowStockId];
        if (!timestamp) {
          timestamp = new Date().toISOString();
          newTimestamps[lowStockId] = timestamp;
          timestampsUpdated = true;
        }

        generatedNotifications.push({
          id: lowStockId,
          icon: <AlertTriangle className="text-yellow-500" />,
          iconBg: "bg-yellow-100",
          title: "Low Stock Warning",
          category: "Low Stock",
          description: `${product.name} has only ${product.quantity} items left.`,
          read: readIds.includes(lowStockId),
          path: `/management?highlight=${product.id}`,
          createdAt: new Date(timestamp),
        });
      }

      const noStockId = `no-stock-${product.id}`;
      if (product.quantity === 0) {
        generatedNotifications.push({
          id: noStockId,
          icon: <PackageX className="text-red-500" />,
          iconBg: "bg-red-100",
          title: "Out of Stock",
          category: "No Stock",
          description: `${product.name} is out of stock.`,
          read: readIds.includes(noStockId),
          path: `/management?highlight=${product.id}`,
          createdAt: new Date(),
        });
      }

      const expiredId = `expired-${product.id}`;
      const expiryDate = new Date(product.expireDate);
      if (expiryDate < today) {
        generatedNotifications.push({
          id: expiredId,
          icon: <AlertTriangle className="text-red-500" />,
          iconBg: "bg-red-100",
          title: "Expired Medicine Alert",
          category: "Expired",
          description: `${product.name} (ID: ${product.id}) has expired.`,
          read: readIds.includes(expiredId),
          path: `/management?highlight=${product.id}`,
          createdAt: expiryDate,
        });
      }
    });

    if (timestampsUpdated) {
      setLowStockTimestamps(newTimestamps);
    }

    generatedNotifications = generatedNotifications.filter(
      (n) => !dismissedIds.includes(n.id)
    );
    generatedNotifications.sort((a, b) => b.createdAt - a.createdAt);

    setNotifications(generatedNotifications);
    setLoading(false);
  }, []);

  // Listen for real-time database changes and local storage changes
  useEffect(() => {
    fetchNotifications();

    // Listen for Supabase real-time updates
    const channel = supabase
      .channel("products-notifications")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        fetchNotifications
      )
      .subscribe();

    // Listen for local storage changes (for CSV import)
    const handleStorageChange = () => {
      fetchNotifications();
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = (notificationId) => {
    const readIds = getReadNotificationIds();
    if (!readIds.includes(notificationId)) {
      setReadNotificationIds([...readIds, notificationId]);
    }
    setNotifications(
      notifications.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
  };

  const handleMarkAllAsRead = () => {
    const allNotificationIds = notifications.map((n) => n.id);
    const readIds = getReadNotificationIds();
    const newReadIds = [...new Set([...readIds, ...allNotificationIds])];
    setReadNotificationIds(newReadIds);
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const handleDismiss = (e, notificationId) => {
    e.preventDefault();
    e.stopPropagation();
    const dismissedIds = getDismissedNotificationIds();
    setDismissedNotificationIds([...dismissedIds, notificationId]);
    setNotifications(notifications.filter((n) => n.id !== notificationId));
  };

  const displayName = user?.user_metadata?.full_name || "Administrator";
  const displayEmail = user?.email || "medcure.ph";
  const avatarUrl = user?.user_metadata?.avatar_url;

  const filteredNotifications =
    activeCategory === "All"
      ? notifications
      : notifications.filter((n) => n.category === activeCategory);

  const renderNotificationContent = () => {
    if (loading)
      return <div className="p-4 text-center text-gray-500">Loading...</div>;
    if (filteredNotifications.length > 0) {
      return (
        <>
          {filteredNotifications.map((notification) => (
            <Link
              to={notification.path || "#"}
              key={notification.id}
              onClick={() => handleMarkAsRead(notification.id)}
              className={`flex items-start gap-3 p-4 transition-colors relative group border-b border-gray-100 ${
                !notification.read
                  ? "bg-blue-50 hover:bg-blue-100"
                  : "hover:bg-gray-50"
              }`}
            >
              <div
                className={`flex-shrink-0 p-2 rounded-full ${notification.iconBg}`}
              >
                {notification.icon}
              </div>
              <div className="flex-grow">
                <p className="font-semibold text-sm text-gray-900">
                  {notification.title}
                </p>
                <p className="text-sm text-gray-600">
                  {notification.description}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {notification.createdAt.toLocaleString()}
                </p>
              </div>
              <button
                onClick={(e) => handleDismiss(e, notification.id)}
                className="ml-2 p-1 rounded-full text-gray-400 hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={14} />
              </button>
            </Link>
          ))}
        </>
      );
    }
    return (
      <div className="text-center py-8 text-gray-500">
        <Bell size={32} className="mx-auto mb-2" />
        <p>No new notifications</p>
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-20 flex items-center h-[69px] bg-white border-b border-gray-200">
      <div className="flex items-center justify-between w-full px-6">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            id="header-search"
            name="header-search"
            className="w-full py-2.5 pl-12 pr-4 text-gray-800 bg-gray-50 border border-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
            placeholder="Search for anything..."
          />
        </div>

        <div className="flex items-center space-x-6">
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="p-2.5 text-gray-500 hover:text-blue-600 relative rounded-full hover:bg-gray-100 transition-colors"
            >
              <Bell className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>
            {notificationsOpen && (
              <div className="absolute right-0 mt-3 w-96 bg-white rounded-xl shadow-lg border border-gray-100 z-30">
                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-800">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="p-2 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center gap-1">
                    <TabButton
                      category="All"
                      activeCategory={activeCategory}
                      setActiveCategory={setActiveCategory}
                    />
                    <TabButton
                      category="Low Stock"
                      activeCategory={activeCategory}
                      setActiveCategory={setActiveCategory}
                    />
                    <TabButton
                      category="No Stock"
                      activeCategory={activeCategory}
                      setActiveCategory={setActiveCategory}
                    />
                    <TabButton
                      category="Expired"
                      activeCategory={activeCategory}
                      setActiveCategory={setActiveCategory}
                    />
                    <TabButton
                      category="System"
                      activeCategory={activeCategory}
                      setActiveCategory={setActiveCategory}
                    />
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {renderNotificationContent()}
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={dropdownRef}>
            <button
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-gray-600" />
                )}
              </div>
              <div className="text-sm hidden md:block">
                <div className="font-semibold text-gray-800">{displayName}</div>
                <div className="text-xs text-gray-500">{displayEmail}</div>
              </div>
              <ChevronDown className="w-5 h-5 text-gray-400" />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-lg py-2 z-30 border border-gray-100">
                <button
                  onClick={handleLogout}
                  className="w-full text-left flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

Header.propTypes = {
  handleLogout: PropTypes.func.isRequired,
  user: PropTypes.object,
};

export default Header;
