import React, { useState, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import Toast from "@/components/Toast";
import { NotificationContext } from "@/context/AppContext";

export const NotificationProvider = ({ children }) => {
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(null);

  const addNotification = useCallback((message, type = "success") => {
    const newItem = { message, type, id: Date.now() };
    setQueue((prev) => [...prev, newItem]);
    if (!current) {
      setCurrent(newItem);
    }
  }, [current]);

  const removeNotification = useCallback(() => {
    setQueue((prev) => {
      const [, ...rest] = prev;
      const next = rest.length > 0 ? rest[0] : null;
      setCurrent(next);
      return rest;
    });
  }, []);

  const contextValue = useMemo(() => ({ addNotification }), [addNotification]);

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      {current && (
        <Toast
          message={current.message}
          type={current.type}
          onClose={removeNotification}
        />
      )}
    </NotificationContext.Provider>
  );
};

NotificationProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
