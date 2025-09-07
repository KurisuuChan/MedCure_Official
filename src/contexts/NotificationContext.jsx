import React, { createContext, useState, useCallback } from "react";
import { Check, AlertTriangle, Info, X, AlertCircle } from "lucide-react";

export const NotificationContext = createContext();

const NotificationItem = ({ notification, onRemove }) => {
  const icons = {
    success: Check,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const Icon = icons[notification.type];

  const bgColors = {
    success: "bg-green-50 border-green-200",
    error: "bg-red-50 border-red-200",
    warning: "bg-yellow-50 border-yellow-200",
    info: "bg-blue-50 border-blue-200",
  };

  const iconColors = {
    success: "text-green-600",
    error: "text-red-600",
    warning: "text-yellow-600",
    info: "text-blue-600",
  };

  return (
    <div
      className={`p-4 border rounded-lg shadow-sm ${
        bgColors[notification.type]
      } transition-all duration-300`}
    >
      <div className="flex items-start">
        <Icon
          className={`w-5 h-5 mt-0.5 mr-3 ${iconColors[notification.type]}`}
        />
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{notification.title}</h4>
          {notification.message && (
            <p className="mt-1 text-sm text-gray-700">{notification.message}</p>
          )}
        </div>
        <button
          onClick={() => onRemove(notification.id)}
          className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      type: "info",
      autoRemove: true,
      duration: 5000,
      ...notification,
    };

    setNotifications((prev) => [...prev, newNotification]);

    if (newNotification.autoRemove) {
      setTimeout(() => {
        setNotifications((prev) =>
          prev.filter((notification) => notification.id !== id)
        );
      }, newNotification.duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Convenience methods
  const success = useCallback(
    (title, message, options = {}) => {
      return addNotification({ type: "success", title, message, ...options });
    },
    [addNotification]
  );

  const error = useCallback(
    (title, message, options = {}) => {
      return addNotification({
        type: "error",
        title,
        message,
        autoRemove: false,
        ...options,
      });
    },
    [addNotification]
  );

  const warning = useCallback(
    (title, message, options = {}) => {
      return addNotification({ type: "warning", title, message, ...options });
    },
    [addNotification]
  );

  const info = useCallback(
    (title, message, options = {}) => {
      return addNotification({ type: "info", title, message, ...options });
    },
    [addNotification]
  );

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    success,
    error,
    warning,
    info,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}

      {/* Notification Container */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm w-full">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onRemove={removeNotification}
            />
          ))}
          {notifications.length > 1 && (
            <button
              onClick={clearAll}
              className="w-full text-sm text-gray-600 hover:text-gray-800 transition-colors py-2"
            >
              Clear all notifications
            </button>
          )}
        </div>
      )}
    </NotificationContext.Provider>
  );
};
