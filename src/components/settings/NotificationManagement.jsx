import { useState, useEffect } from "react";
import {
  Bell,
  Mail,
  AlertCircle,
  CheckCircle,
  Loader,
  Search,
  Eye,
  Package,
} from "lucide-react";
import { notificationService } from "../../services/notifications/NotificationService";
import { emailService } from "../../services/notifications/EmailService";
import { supabase } from "../../config/supabase";

function NotificationManagement({ user, showSuccess, showError }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [checkingStock, setCheckingStock] = useState(false);
  const [stockAlert, setStockAlert] = useState(null);
  const [emailRecipient, setEmailRecipient] = useState(
    "iannsantiago19@gmail.com"
  );

  // Load notifications on mount
  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;

      setLoading(true);
      try {
        const result = await notificationService.getUserNotifications(user.id, {
          limit: 20,
          offset: 0,
        });
        setNotifications(result?.notifications || []);
      } catch (error) {
        console.error("Failed to load notifications:", error);
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const loadNotifications = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const result = await notificationService.getUserNotifications(user.id, {
        limit: 20,
        offset: 0,
      });
      setNotifications(result?.notifications || []);
    } catch (error) {
      console.error("Failed to load notifications:", error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(
        notifications.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      showSuccess("Notification marked as read");
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
      showError("Failed to mark notification as read");
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
      await Promise.all(
        unreadIds.map((id) => notificationService.markAsRead(id))
      );
      setNotifications(notifications.map((n) => ({ ...n, read: true })));
      showSuccess("All notifications marked as read");
    } catch (err) {
      console.error("Failed to mark all as read:", err);
      showError("Failed to mark all as read");
    }
  };

  // Check inventory and send email alerts for low/out of stock
  const checkInventoryAndSendAlert = async () => {
    setCheckingStock(true);
    setStockAlert(null);
    try {
      // Fetch all active products - we'll filter in JavaScript since Supabase 
      // doesn't support column-to-column comparison in .or() filters
      const { data: allProducts, error } = await supabase
        .from("products")
        .select("id, brand_name, generic_name, stock_in_pieces, reorder_level")
        .eq("is_active", true)
        .order("stock_in_pieces", { ascending: true });

      if (error) throw error;

      if (!allProducts || allProducts.length === 0) {
        showError("No products found in inventory");
        return;
      }

      // Filter for out of stock and low stock items
      const outOfStock = allProducts.filter((p) => p.stock_in_pieces === 0);
      const lowStock = allProducts.filter(
        (p) =>
          p.stock_in_pieces > 0 && 
          p.stock_in_pieces <= (p.reorder_level || 10)
      );

      // Combine problem items
      const problemItems = [...outOfStock, ...lowStock];

      if (problemItems.length === 0) {
        showSuccess("✅ All products are in good stock!");
        setStockAlert({
          type: "success",
          message: "All inventory levels are healthy",
        });
        return;
      }

      // Generate professional email HTML
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">🏥 MedCure Pharmacy</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px;">Inventory Alert Report</p>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="font-size: 16px; color: #374151;">
              <strong>Alert Summary</strong><br>
              Generated: ${new Date().toLocaleString()}<br>
              Total Items Requiring Attention: <strong>${
                problemItems.length
              }</strong>
            </p>

            ${
              outOfStock.length > 0
                ? `
              <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <h3 style="color: #dc2626; margin: 0 0 10px 0;">🚨 OUT OF STOCK (${
                  outOfStock.length
                } items)</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <thead>
                    <tr style="background: #fee2e2;">
                      <th style="padding: 10px; text-align: left; border-bottom: 2px solid #fecaca;">Product</th>
                      <th style="padding: 10px; text-align: center; border-bottom: 2px solid #fecaca;">Stock</th>
                      <th style="padding: 10px; text-align: center; border-bottom: 2px solid #fecaca;">Reorder Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${outOfStock
                      .map(
                        (p) => `
                      <tr style="border-bottom: 1px solid #fecaca;">
                        <td style="padding: 10px;">${
                          p.brand_name || p.generic_name
                        }</td>
                        <td style="padding: 10px; text-align: center; color: #dc2626; font-weight: bold;">0</td>
                        <td style="padding: 10px; text-align: center;">${
                          p.reorder_level || 10
                        }</td>
                      </tr>
                    `
                      )
                      .join("")}
                  </tbody>
                </table>
              </div>
            `
                : ""
            }

            ${
              lowStock.length > 0
                ? `
              <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <h3 style="color: #d97706; margin: 0 0 10px 0;">⚠️ LOW STOCK (${
                  lowStock.length
                } items)</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <thead>
                    <tr style="background: #fef3c7;">
                      <th style="padding: 10px; text-align: left; border-bottom: 2px solid #fde68a;">Product</th>
                      <th style="padding: 10px; text-align: center; border-bottom: 2px solid #fde68a;">Current Stock</th>
                      <th style="padding: 10px; text-align: center; border-bottom: 2px solid #fde68a;">Reorder Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${lowStock
                      .map(
                        (p) => `
                      <tr style="border-bottom: 1px solid #fde68a;">
                        <td style="padding: 10px;">${
                          p.brand_name || p.generic_name
                        }</td>
                        <td style="padding: 10px; text-align: center; color: #d97706; font-weight: bold;">${
                          p.stock_in_pieces
                        }</td>
                        <td style="padding: 10px; text-align: center;">${
                          p.reorder_level || 10
                        }</td>
                      </tr>
                    `
                      )
                      .join("")}
                  </tbody>
                </table>
              </div>
            `
                : ""
            }

            <div style="background: #f3f4f6; padding: 15px; margin-top: 30px; border-radius: 5px;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                <strong>📋 Action Required:</strong><br>
                Please review these items and place orders as needed to maintain optimal inventory levels.
              </p>
            </div>
          </div>

          <div style="background: #f9fafb; padding: 20px; border-radius: 0 0 10px 10px; text-align: center;">
            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
              © ${new Date().getFullYear()} MedCure Pharmacy Management System<br>
              This is an automated alert from your inventory monitoring system.
            </p>
          </div>
        </div>
      `;

      // Send email alert
      await emailService.send({
        to: emailRecipient,
        subject: `🚨 MedCure Inventory Alert - ${outOfStock.length} Out of Stock, ${lowStock.length} Low Stock`,
        html: emailContent,
        text: `MedCure Inventory Alert:\n\nOut of Stock: ${outOfStock.length} items\nLow Stock: ${lowStock.length} items\n\nPlease check your inventory management system for details.`,
      });

      setStockAlert({
        type: outOfStock.length > 0 ? "critical" : "warning",
        outOfStock: outOfStock.length,
        lowStock: lowStock.length,
        total: problemItems.length,
      });

      showSuccess(
        `📧 Inventory alert sent to ${emailRecipient}! Found ${outOfStock.length} out of stock and ${lowStock.length} low stock items.`
      );
    } catch (err) {
      console.error("Failed to check inventory:", err);
      showError("Failed to check inventory and send alert");
    } finally {
      setCheckingStock(false);
    }
  };

  // Filter notifications based on search
  const filteredNotifications = notifications.filter(
    (notification) =>
      notification.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  const tabs = [
    { id: "overview", label: "Overview", icon: Bell },
    { id: "notifications", label: "Notifications", icon: Mail },
    { id: "inventory", label: "Inventory Alerts", icon: Package },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-purple-500 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.id === "notifications" && unreadCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-red-500 text-white rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <Bell className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {notifications.length}
                </h3>
                <p className="text-sm text-gray-600">Total Notifications</p>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {unreadCount}
                </h3>
                <p className="text-sm text-gray-600">Unread</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {notifications.filter((n) => n.read).length}
                </h3>
                <p className="text-sm text-gray-600">Read</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Mark All as Read</span>
                </button>

                <button
                  onClick={loadNotifications}
                  disabled={loading}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Loader
                    className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                  />
                  <span>Refresh Notifications</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search notifications..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                Mark All Read
              </button>
            </div>

            {/* Notifications List */}
            <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="h-8 w-8 animate-spin text-purple-600" />
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <Bell className="h-12 w-12 mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No notifications found</p>
                  <p className="text-sm">All caught up!</p>
                </div>
              ) : (
                filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      !notification.read ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-gray-900">
                            {notification.title || "Notification"}
                          </h4>
                          {!notification.read && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {notification.message || "No message"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Mark as read"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "inventory" && (
          <div className="space-y-6">
            {/* Stock Alert Status */}
            {stockAlert && (
              <div
                className={`p-4 rounded-lg border ${
                  stockAlert.type === "critical"
                    ? "bg-red-50 border-red-200"
                    : stockAlert.type === "warning"
                    ? "bg-yellow-50 border-yellow-200"
                    : "bg-green-50 border-green-200"
                }`}
              >
                <div className="flex items-start space-x-3">
                  {stockAlert.type === "critical" ? (
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  ) : stockAlert.type === "warning" ? (
                    <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {stockAlert.type === "success"
                        ? "✅ All Stock Levels Good"
                        : "📧 Inventory Alert Sent"}
                    </h4>
                    {stockAlert.type !== "success" && (
                      <p className="text-sm text-gray-600 mt-1">
                        Found {stockAlert.outOfStock} out of stock and{" "}
                        {stockAlert.lowStock} low stock items. Email sent to{" "}
                        <strong>{emailRecipient}</strong>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Automated Inventory Check */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
                <Package className="h-5 w-5 text-purple-600" />
                <span>Inventory Stock Alert System</span>
              </h3>

              <p className="text-sm text-gray-600 mb-4">
                Check all products in inventory for low stock and out of stock
                items, then send an automated email alert with a detailed
                report.
              </p>

              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center space-x-2">
                  <span>📊</span>
                  <span>How it works:</span>
                </h4>
                <ul className="text-sm text-gray-600 space-y-2 ml-6 list-disc">
                  <li>Scans all products in your inventory database</li>
                  <li>Identifies items at or below reorder level</li>
                  <li>Identifies out of stock items (0 quantity)</li>
                  <li>Sends a professionally formatted HTML email report</li>
                  <li>
                    Includes product names, current stock, and reorder levels
                  </li>
                  <li>
                    Color-coded:{" "}
                    <span className="text-red-600 font-semibold">Red</span> for
                    out of stock,
                    <span className="text-yellow-600 font-semibold">
                      {" "}
                      Yellow
                    </span>{" "}
                    for low stock
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alert Email Address
                  </label>
                  <input
                    type="email"
                    value={emailRecipient}
                    onChange={(e) => setEmailRecipient(e.target.value)}
                    placeholder="Enter email address"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Email address where inventory alerts will be sent
                  </p>
                </div>

                <button
                  onClick={checkInventoryAndSendAlert}
                  disabled={checkingStock || !emailRecipient}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  {checkingStock ? (
                    <>
                      <Loader className="h-5 w-5 animate-spin" />
                      <span>Checking Inventory...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="h-5 w-5" />
                      <span>Check Inventory & Send Alert</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Pro Tip</h4>
                  <p className="text-sm text-blue-700">
                    Set up automated daily checks by integrating this with your
                    workflow. You can also use this before placing orders to see
                    exactly what needs restocking.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default NotificationManagement;
