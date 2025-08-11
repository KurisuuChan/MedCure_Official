import React, { useState, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import Toast from "@/components/Toast";
import { NotificationContext } from "@/context/AppContext";

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState(null);

  const addNotification = useCallback((message, type = "success") => {
    setNotification({ message, type, id: Date.now() });
  }, []);

  const removeNotification = useCallback(() => {
    setNotification(null);
  }, []);

  const contextValue = useMemo(() => ({ addNotification }), [addNotification]);

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      {notification && (
        <Toast
          message={notification.message}
          type={notification.type}
          onClose={removeNotification}
        />
      )}
    </NotificationContext.Provider>
  );
};

NotificationProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
