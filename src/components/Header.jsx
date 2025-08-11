import { useState, useEffect } from "react";
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
} from "lucide-react";

const Header = ({ handleLogout, user }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper functions to manage read status in localStorage
  const getReadNotificationIds = () => {
    try {
      const readIds = localStorage.getItem("readNotificationIds");
      return readIds ? JSON.parse(readIds) : [];
    } catch (e) {
      console.error("Failed to parse read notifications from localStorage", e);
      return [];
    }
  };

  const setReadNotificationIds = (ids) => {
    localStorage.setItem("readNotificationIds", JSON.stringify(ids));
  };

  useEffect(() => {
    const fetchNotifications = async () => {
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
      const lowStockThreshold = 10;
      const today = new Date();
      const generatedNotifications = [];

      products.forEach((product) => {
        const lowStockId = `low-${product.id}`;
        if (product.quantity <= lowStockThreshold && product.quantity > 0) {
          generatedNotifications.push({
            id: lowStockId,
            icon: <AlertTriangle className="text-yellow-500" />,
            iconBg: "bg-yellow-100",
            title: "Low Stock Warning",
            description: `${product.name} has only ${product.quantity} items left.`,
            time: "Recently",
            read: readIds.includes(lowStockId),
            path: `/management?highlight=${product.id}`,
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
            description: `${product.name} (ID: ${product.id}) has expired.`,
            time: "Recently",
            read: readIds.includes(expiredId),
            path: `/management?highlight=${product.id}`,
          });
        }
      });

      setNotifications(generatedNotifications);
      setLoading(false);
    };

    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = (id) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    const readIds = getReadNotificationIds();
    if (!readIds.includes(id)) {
      setReadNotificationIds([...readIds, id]);
    }
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
    const allIds = notifications.map((n) => n.id);
    setReadNotificationIds(allIds);
  };

  const displayName = user?.user_metadata?.full_name || "Administrator";
  const displayEmail = user?.email || "medcure.ph";
  const avatarUrl = user?.user_metadata?.avatar_url;

  const renderNotificationContent = () => {
    if (loading) {
      return <div className="p-4 text-center text-gray-500">Loading...</div>;
    }

    if (notifications.length > 0) {
      return (
        <>
          {notifications.map((notification) => (
            <Link
              to={notification.path}
              key={notification.id}
              onClick={() => handleMarkAsRead(notification.id)}
              className={`flex items-start gap-3 p-4 transition-colors ${
                !notification.read ? "bg-blue-50" : "hover:bg-gray-50"
              }`}
            >
              <div
                className={`flex-shrink-0 p-2 rounded-full ${notification.iconBg}`}
              >
                {notification.icon}
              </div>
              <div className="flex-grow">
                <p className="font-semibold text-sm text-gray-800">
                  {notification.title}
                </p>
                <p className="text-xs text-gray-600">
                  {notification.description}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {notification.time}
                </p>
              </div>
              {!notification.read && (
                <div
                  className="w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0 mt-1"
                  title="Unread"
                ></div>
              )}
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
          <div className="relative">
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
              <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-30">
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
                <div className="max-h-96 overflow-y-auto">
                  {renderNotificationContent()}
                </div>
              </div>
            )}
          </div>

          <div className="relative">
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
