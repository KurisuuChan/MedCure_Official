import React, { useState } from "react";
import { Bell, Package, AlertTriangle, CheckCircle, X } from "lucide-react";

const Notification = () => {
  const initialNotifications = [
    {
      id: 1,
      icon: <Package className="text-blue-500" />,
      iconBg: "bg-blue-100",
      title: "New Order Received",
      description: "Order #12542 has been successfully placed.",
      time: "15 minutes ago",
      read: false,
    },
    {
      id: 2,
      icon: <AlertTriangle className="text-yellow-500" />,
      iconBg: "bg-yellow-100",
      title: "Low Stock Warning",
      description: "Aspirin 80mg is running low in stock.",
      time: "1 hour ago",
      read: false,
    },
    {
      id: 3,
      icon: <CheckCircle className="text-green-500" />,
      iconBg: "bg-green-100",
      title: "Shipment Delivered",
      description: "Your recent supply order has been delivered.",
      time: "5 hours ago",
      read: true,
    },
    {
      id: 4,
      icon: <AlertTriangle className="text-red-500" />,
      iconBg: "bg-red-100",
      title: "Expired Medicine Alert",
      description: "Batch #54321 of Paracetamol has expired.",
      time: "1 day ago",
      read: true,
    },
  ];

  const [notifications, setNotifications] = useState(initialNotifications);

  const handleMarkAsRead = (id) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleClearNotification = (id) => {
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 border-b pb-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <Bell className="text-gray-700" size={24} />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            Notifications
          </h1>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {unreadCount} New
            </span>
          )}
        </div>
        <div className="flex gap-4 text-sm justify-end">
          <button
            onClick={handleMarkAllAsRead}
            className="text-blue-600 hover:underline"
          >
            Mark all as read
          </button>
          <button
            onClick={handleClearAll}
            className="text-gray-500 hover:underline"
          >
            Clear all
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 p-4 rounded-xl transition-colors ${
                !notification.read
                  ? "bg-blue-50"
                  : "bg-transparent hover:bg-gray-50"
              }`}
            >
              <div
                className={`flex-shrink-0 p-3 rounded-full ${notification.iconBg}`}
              >
                {notification.icon}
              </div>
              <div className="flex-grow">
                <h3 className="font-semibold text-gray-800 text-base sm:text-lg">
                  {notification.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {notification.description}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {notification.time}
                </p>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-center">
                {!notification.read && (
                  <button
                    onClick={() => handleMarkAsRead(notification.id)}
                    className="w-3 h-3 bg-blue-500 rounded-full"
                    title="Mark as read"
                  ></button>
                )}
                <button
                  onClick={() => handleClearNotification(notification.id)}
                  className="text-gray-400 hover:text-red-500 p-1"
                  title="Remove"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-16 text-gray-500">
            <Bell size={40} className="mx-auto mb-4" />
            <h3 className="text-xl font-semibold">No new notifications</h3>
            <p>You're all caught up!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notification;
