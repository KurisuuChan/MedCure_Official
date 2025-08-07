import React from "react";

const NotificationSettings = () => (
  <div>
    <h2 className="text-3xl font-bold text-gray-800 mb-2">Notifications</h2>
    <p className="text-gray-500 mb-8 border-b pb-6">
      Control how you receive notifications from us.
    </p>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold">Email Notifications</h4>
          <p className="text-sm text-gray-500">
            Get emails about new orders, low stock, and system updates.
          </p>
        </div>
        <label
          className="relative inline-flex items-center cursor-pointer"
          aria-label="Email Notifications"
        >
          <input type="checkbox" defaultChecked className="sr-only peer" />
          <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold">Push Notifications</h4>
          <p className="text-sm text-gray-500">
            Receive alerts directly on your device.
          </p>
        </div>
        <label
          className="relative inline-flex items-center cursor-pointer"
          aria-label="Push Notifications"
        >
          <input type="checkbox" className="sr-only peer" />
          <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
    </div>
  </div>
);

export default NotificationSettings;
