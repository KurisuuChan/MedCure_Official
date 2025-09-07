import React, { createContext, useContext, useState, useCallback } from "react";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

const Toast = ({ toast, onRemove }) => {
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const Icon = icons[toast.type];

  const bgColors = {
    success:
      "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
    error: "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800",
    warning:
      "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800",
    info: "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800",
  };

  const iconColors = {
    success: "text-green-600 dark:text-green-400",
    error: "text-red-600 dark:text-red-400",
    warning: "text-yellow-600 dark:text-yellow-400",
    info: "text-blue-600 dark:text-blue-400",
  };

  const textColors = {
    success: "text-green-800 dark:text-green-200",
    error: "text-red-800 dark:text-red-200",
    warning: "text-yellow-800 dark:text-yellow-200",
    info: "text-blue-800 dark:text-blue-200",
  };

  return (
    <div
      className={`
        flex items-start gap-3 p-4 mb-3 border rounded-lg shadow-sm transition-all duration-300
        ${bgColors[toast.type]}
        transform translate-x-0 opacity-100
      `}
    >
      <Icon
        className={`h-5 w-5 flex-shrink-0 mt-0.5 ${iconColors[toast.type]}`}
      />

      <div className="flex-1 min-w-0">
        {toast.title && (
          <h4 className={`text-sm font-medium ${textColors[toast.type]} mb-1`}>
            {toast.title}
          </h4>
        )}
        <p
          className={`text-sm ${textColors[toast.type]} ${
            toast.title ? "opacity-90" : ""
          }`}
        >
          {toast.message}
        </p>
      </div>

      <button
        onClick={() => onRemove(toast.id)}
        className={`
          flex-shrink-0 p-1 rounded-md transition-colors
          hover:bg-white/50 dark:hover:bg-gray-800/50
          ${iconColors[toast.type]}
        `}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(
    (toast) => {
      const id = Date.now() + Math.random();
      const newToast = {
        id,
        type: "info",
        duration: 5000,
        ...toast,
      };

      setToasts((prev) => [...prev, newToast]);

      // Auto remove toast after duration
      if (newToast.duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, newToast.duration);
      }

      return id;
    },
    [removeToast]
  );

  const removeAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const success = useCallback(
    (message, options = {}) => {
      return addToast({ ...options, message, type: "success" });
    },
    [addToast]
  );

  const error = useCallback(
    (message, options = {}) => {
      return addToast({ ...options, message, type: "error", duration: 8000 });
    },
    [addToast]
  );

  const warning = useCallback(
    (message, options = {}) => {
      return addToast({ ...options, message, type: "warning", duration: 6000 });
    },
    [addToast]
  );

  const info = useCallback(
    (message, options = {}) => {
      return addToast({ ...options, message, type: "info" });
    },
    [addToast]
  );

  const value = {
    toasts,
    addToast,
    removeToast,
    removeAllToasts,
    success,
    error,
    warning,
    info,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 w-full max-w-sm pointer-events-none">
        <div className="pointer-events-auto">
          {toasts.map((toast) => (
            <Toast key={toast.id} toast={toast} onRemove={removeToast} />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
};
