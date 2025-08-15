// src/pages/NotificationHistory.jsx
import React from "react";
import PropTypes from "prop-types";
import { useNotificationHistory } from "@/hooks/useNotifications.jsx";
import { Bell, Loader2 } from "lucide-react";
import { NotificationItem } from "@/components/notifications/NotificationItem";

const NotificationHistory = () => {
  const { notifications, loading, groupedByDate, markAsRead, dismiss } =
    useNotificationHistory();

  // --- FIX: Moved rendering logic into a separate function for clarity ---
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-blue-500" size={40} />
        </div>
      );
    }

    if (!notifications || notifications.length === 0) {
      return (
        <div className="text-center py-20 text-gray-500">
          <Bell size={48} className="mx-auto mb-4" />
          <h2 className="text-2xl font-semibold">No Notifications Yet</h2>
          <p className="text-md">
            When you get notifications, they'll show up here.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {groupedByDate?.map(
          (
            { date, items } // Use optional chaining for safety
          ) => (
            <div
              key={date}
              className="border border-gray-200 rounded-xl overflow-hidden"
            >
              <h3 className="text-sm font-bold text-gray-600 p-4 bg-gray-50 border-b border-gray-200">
                {date}
              </h3>
              <div className="divide-y divide-gray-100">
                {items.map((item) => (
                  <NotificationItem
                    key={item.id}
                    item={item}
                    onMarkAsRead={markAsRead}
                    onDismiss={dismiss}
                  />
                ))}
              </div>
            </div>
          )
        )}
      </div>
    );
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-blue-100">
            <Bell size={32} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Notification History
            </h1>
            <p className="text-gray-500 mt-1">
              A complete log of all system and inventory alerts.
            </p>
          </div>
        </div>
      </div>
      {renderContent()}
    </div>
  );
};

export default NotificationHistory;
