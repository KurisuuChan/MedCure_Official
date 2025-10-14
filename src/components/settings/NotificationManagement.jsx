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
          p.stock_in_pieces > 0 && p.stock_in_pieces <= (p.reorder_level || 10)
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

      // Generate professional, informative email HTML
      const currentDate = new Date();
      const formattedDate = currentDate.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const formattedTime = currentDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });

      // Pre-calculate values to avoid nested template literal issues
      const alertBgColor = outOfStock.length > 0 ? "#fee2e2" : "#fef3c7";
      const alertBorderColor = outOfStock.length > 0 ? "#dc2626" : "#f59e0b";
      const alertEmoji = outOfStock.length > 0 ? "🚨" : "⚠️";
      const alertTextColor = outOfStock.length > 0 ? "#991b1b" : "#92400e";
      const alertTitle = outOfStock.length > 0 ? "CRITICAL ALERT" : "WARNING ALERT";
      
      const outOfStockWidth = lowStock.length > 0 ? "48%" : "100%";
      const outOfStockPaddingRight = lowStock.length > 0 ? "2%" : "0";
      const lowStockWidth = outOfStock.length > 0 ? "48%" : "100%";
      const lowStockPaddingLeft = outOfStock.length > 0 ? "2%" : "0";
      
      const outOfStockLabel = outOfStock.length === 1 ? "Item" : "Items";
      const lowStockLabel = lowStock.length === 1 ? "Item" : "Items";

      const emailContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MedCure Inventory Alert</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);" width="100%" cellpadding="0" cellspacing="0" border="0">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold; letter-spacing: -0.5px;">
                🏥 MedCure Pharmacy
              </h1>
              <p style="margin: 15px 0 0 0; color: #f3e8ff; font-size: 18px; font-weight: 500;">
                Inventory Status Alert
              </p>
            </td>
          </tr>

          <!-- Alert Banner -->
          <tr>
            <td style="padding: 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background: ${alertBgColor}; padding: 20px 30px; border-left: 5px solid ${alertBorderColor};">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-size: 48px; text-align: center; padding-right: 15px; vertical-align: middle; width: 60px;">
                          ${alertEmoji}
                        </td>
                        <td style="vertical-align: middle;">
                          <h2 style="margin: 0; color: ${alertTextColor}; font-size: 20px; font-weight: bold;">
                            ${alertTitle}
                          </h2>
                          <p style="margin: 5px 0 0 0; color: ${alertTextColor}; font-size: 14px;">
                            Immediate attention required for inventory items
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Summary Section -->
          <tr>
            <td style="padding: 30px;">
              <h3 style="margin: 0 0 20px 0; color: #111827; font-size: 18px; font-weight: 600; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
                📊 Alert Summary
              </h3>
              
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #f9fafb; border-radius: 8px; padding: 15px;">
                <tr>
                  <td style="padding: 8px 0;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; padding: 5px 0;">📅 Date:</td>
                        <td style="color: #111827; font-size: 14px; font-weight: 600; text-align: right; padding: 5px 0;">${formattedDate}</td>
                      </tr>
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; padding: 5px 0;">⏰ Time:</td>
                        <td style="color: #111827; font-size: 14px; font-weight: 600; text-align: right; padding: 5px 0;">${formattedTime}</td>
                      </tr>
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; padding: 5px 0;">📦 Total Products Affected:</td>
                        <td style="color: #7c3aed; font-size: 18px; font-weight: bold; text-align: right; padding: 5px 0;">${
                          problemItems.length
                        }</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Statistics Cards -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 20px;">
                <tr>
                  ${
                    outOfStock.length > 0
                      ? `
                  <td style="width: ${outOfStockWidth}; padding-right: ${outOfStockPaddingRight};">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #fef2f2; border: 2px solid #fecaca; border-radius: 8px; padding: 15px; text-align: center;">
                      <tr>
                        <td>
                          <div style="font-size: 36px; font-weight: bold; color: #dc2626; margin-bottom: 5px;">${
                            outOfStock.length
                          }</div>
                          <div style="font-size: 12px; color: #991b1b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">OUT OF STOCK</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  `
                      : ""
                  }
                  ${
                    lowStock.length > 0
                      ? `
                  <td style="width: ${lowStockWidth}; padding-left: ${lowStockPaddingLeft};">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #fffbeb; border: 2px solid #fde68a; border-radius: 8px; padding: 15px; text-align: center;">
                      <tr>
                        <td>
                          <div style="font-size: 36px; font-weight: bold; color: #d97706; margin-bottom: 5px;">${
                            lowStock.length
                          }</div>
                          <div style="font-size: 12px; color: #92400e; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">LOW STOCK</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  `
                      : ""
                  }
                </tr>
              </table>
            </td>
          </tr>

          ${
            outOfStock.length > 0
              ? `
          <!-- Out of Stock Section -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <div style="background: #fef2f2; border-radius: 8px; padding: 20px; border-left: 4px solid #dc2626;">
                <h3 style="margin: 0 0 15px 0; color: #991b1b; font-size: 18px; font-weight: bold;">
                  🚨 OUT OF STOCK - CRITICAL (${outOfStock.length} ${outOfStockLabel})
                </h3>
                <p style="margin: 0 0 15px 0; color: #7f1d1d; font-size: 14px;">
                  These products have <strong>ZERO</strong> stock available and need immediate restocking:
                </p>
                
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: white; border-radius: 6px; overflow: hidden; border: 1px solid #fecaca;">
                  <thead>
                    <tr style="background: #fee2e2;">
                      <th style="padding: 12px; text-align: left; color: #991b1b; font-size: 13px; font-weight: 600; border-bottom: 2px solid #fecaca;">PRODUCT NAME</th>
                      <th style="padding: 12px; text-align: center; color: #991b1b; font-size: 13px; font-weight: 600; border-bottom: 2px solid #fecaca; width: 120px;">CURRENT STOCK</th>
                      <th style="padding: 12px; text-align: center; color: #991b1b; font-size: 13px; font-weight: 600; border-bottom: 2px solid #fecaca; width: 120px;">REORDER AT</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${outOfStock
                      .map(
                        (p, index) => `
                    <tr style="border-bottom: ${
                      index < outOfStock.length - 1
                        ? "1px solid #fecaca"
                        : "none"
                    };">
                      <td style="padding: 12px; color: #111827; font-size: 14px;">
                        <strong>${
                          p.brand_name || p.generic_name || "Unknown Product"
                        }</strong>
                        ${
                          p.brand_name &&
                          p.generic_name &&
                          p.brand_name !== p.generic_name
                            ? `<br><span style="color: #6b7280; font-size: 12px;">${p.generic_name}</span>`
                            : ""
                        }
                      </td>
                      <td style="padding: 12px; text-align: center;">
                        <span style="display: inline-block; background: #dc2626; color: white; padding: 6px 12px; border-radius: 20px; font-weight: bold; font-size: 14px;">0</span>
                      </td>
                      <td style="padding: 12px; text-align: center; color: #6b7280; font-size: 14px; font-weight: 500;">${
                        p.reorder_level || 10
                      }</td>
                    </tr>
                    `
                      )
                      .join("")}
                  </tbody>
                </table>
              </div>
            </td>
          </tr>
          `
              : ""
          }

          ${
            lowStock.length > 0
              ? `
          <!-- Low Stock Section -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <div style="background: #fffbeb; border-radius: 8px; padding: 20px; border-left: 4px solid #f59e0b;">
                <h3 style="margin: 0 0 15px 0; color: #92400e; font-size: 18px; font-weight: bold;">
                  ⚠️ LOW STOCK - WARNING (${lowStock.length} ${lowStockLabel})
                </h3>
                <p style="margin: 0 0 15px 0; color: #78350f; font-size: 14px;">
                  These products are at or below their reorder level and should be restocked soon:
                </p>
                
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: white; border-radius: 6px; overflow: hidden; border: 1px solid #fde68a;">
                  <thead>
                    <tr style="background: #fef3c7;">
                      <th style="padding: 12px; text-align: left; color: #92400e; font-size: 13px; font-weight: 600; border-bottom: 2px solid #fde68a;">PRODUCT NAME</th>
                      <th style="padding: 12px; text-align: center; color: #92400e; font-size: 13px; font-weight: 600; border-bottom: 2px solid #fde68a; width: 120px;">CURRENT STOCK</th>
                      <th style="padding: 12px; text-align: center; color: #92400e; font-size: 13px; font-weight: 600; border-bottom: 2px solid #fde68a; width: 120px;">REORDER AT</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${lowStock
                      .map(
                        (p, index) => `
                    <tr style="border-bottom: ${
                      index < lowStock.length - 1 ? "1px solid #fde68a" : "none"
                    };">
                      <td style="padding: 12px; color: #111827; font-size: 14px;">
                        <strong>${
                          p.brand_name || p.generic_name || "Unknown Product"
                        }</strong>
                        ${
                          p.brand_name &&
                          p.generic_name &&
                          p.brand_name !== p.generic_name
                            ? `<br><span style="color: #6b7280; font-size: 12px;">${p.generic_name}</span>`
                            : ""
                        }
                      </td>
                      <td style="padding: 12px; text-align: center;">
                        <span style="display: inline-block; background: #f59e0b; color: white; padding: 6px 12px; border-radius: 20px; font-weight: bold; font-size: 14px;">${
                          p.stock_in_pieces
                        }</span>
                      </td>
                      <td style="padding: 12px; text-align: center; color: #6b7280; font-size: 14px; font-weight: 500;">${
                        p.reorder_level || 10
                      }</td>
                    </tr>
                    `
                      )
                      .join("")}
                  </tbody>
                </table>
              </div>
            </td>
          </tr>
          `
              : ""
          }

          <!-- Action Required Section -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 8px; padding: 20px; border: 2px solid #3b82f6;">
                <tr>
                  <td style="padding-right: 15px; vertical-align: top; width: 40px;">
                    <div style="font-size: 32px;">📋</div>
                  </td>
                  <td>
                    <h3 style="margin: 0 0 10px 0; color: #1e40af; font-size: 16px; font-weight: bold;">ACTION REQUIRED</h3>
                    <p style="margin: 0; color: #1e3a8a; font-size: 14px; line-height: 1.6;">
                      Please review these inventory items and take appropriate action:
                    </p>
                    <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #1e3a8a; font-size: 14px; line-height: 1.8;">
                      ${
                        outOfStock.length > 0
                          ? "<li><strong>OUT OF STOCK items</strong>: Place emergency orders immediately</li>"
                          : ""
                      }
                      ${
                        lowStock.length > 0
                          ? "<li><strong>LOW STOCK items</strong>: Schedule restocking orders this week</li>"
                          : ""
                      }
                      <li>Update your purchase orders and contact suppliers</li>
                      <li>Check for any pending deliveries that may resolve these issues</li>
                    </ul>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #f9fafb; padding: 25px 30px; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 13px; line-height: 1.6;">
                <strong style="color: #111827;">MedCure Pharmacy Management System</strong><br>
                Automated Inventory Monitoring & Alert Service
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                © ${new Date().getFullYear()} MedCure. All rights reserved.<br>
                This is an automated message. Please do not reply to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `;

      // Generate professional plain text version for FormSubmit
      const plainTextContent = `
═══════════════════════════════════════════════════════════════════
🏥 MEDCURE PHARMACY - INVENTORY STATUS ALERT
═══════════════════════════════════════════════════════════════════

${
  outOfStock.length > 0 ? "🚨 CRITICAL ALERT" : "⚠️ WARNING ALERT"
} - Immediate Attention Required

───────────────────────────────────────────────────────────────────
📊 ALERT SUMMARY
───────────────────────────────────────────────────────────────────
Generated: ${formattedDate} at ${formattedTime}
Total Products Requiring Attention: ${problemItems.length}

Statistics:
  • OUT OF STOCK: ${outOfStock.length} ${
        outOfStock.length === 1 ? "item" : "items"
      }
  • LOW STOCK:    ${lowStock.length} ${lowStock.length === 1 ? "item" : "items"}

${
  outOfStock.length > 0
    ? `
═══════════════════════════════════════════════════════════════════
🚨 OUT OF STOCK - CRITICAL (${outOfStock.length} ${outOfStockLabel})
═══════════════════════════════════════════════════════════════════
These products have ZERO stock available and need IMMEDIATE restocking:

${outOfStock
  .map(
    (p, index) =>
      `${index + 1}. ${p.brand_name || p.generic_name || "Unknown Product"}
   ${
     p.brand_name && p.generic_name && p.brand_name !== p.generic_name
       ? `   (Generic: ${p.generic_name})`
       : ""
   }
   Current Stock: 0 units
   Reorder Level: ${p.reorder_level || 10} units
   ⚠️ STATUS: CRITICAL - ORDER IMMEDIATELY
   ─────────────────────────────────────────────────────────────`
  )
  .join("\n\n")}
`
    : ""
}

${
  lowStock.length > 0
    ? `
═══════════════════════════════════════════════════════════════════
⚠️ LOW STOCK - WARNING (${lowStock.length} ${lowStockLabel})
═══════════════════════════════════════════════════════════════════
These products are at or below their reorder level:

${lowStock
  .map(
    (p, index) =>
      `${index + 1}. ${p.brand_name || p.generic_name || "Unknown Product"}
   ${
     p.brand_name && p.generic_name && p.brand_name !== p.generic_name
       ? `   (Generic: ${p.generic_name})`
       : ""
   }
   Current Stock: ${p.stock_in_pieces} units
   Reorder Level: ${p.reorder_level || 10} units
   ⚠️ STATUS: RESTOCK SOON
   ─────────────────────────────────────────────────────────────`
  )
  .join("\n\n")}
`
    : ""
}

═══════════════════════════════════════════════════════════════════
📋 ACTION REQUIRED
═══════════════════════════════════════════════════════════════════
Please take the following actions:

${
  outOfStock.length > 0
    ? "1. 🚨 OUT OF STOCK ITEMS: Place emergency orders IMMEDIATELY\n"
    : ""
}${
        lowStock.length > 0
          ? `${
              outOfStock.length > 0 ? "2" : "1"
            }. ⚠️ LOW STOCK ITEMS: Schedule restocking orders this week\n`
          : ""
      }${
        outOfStock.length > 0 || lowStock.length > 0
          ? `${
              outOfStock.length > 0 && lowStock.length > 0 ? "3" : "2"
            }. 📝 Update your purchase orders and contact suppliers\n`
          : ""
      }${
        outOfStock.length > 0 || lowStock.length > 0
          ? `${
              outOfStock.length > 0 && lowStock.length > 0 ? "4" : "3"
            }. 📦 Check for any pending deliveries that may resolve these issues\n`
          : ""
      }
───────────────────────────────────────────────────────────────────

Need Help?
• Log into MedCure Pharmacy Management System for full details
• Contact your procurement team with this report
• Review supplier contracts for expedited delivery options

═══════════════════════════════════════════════════════════════════
MedCure Pharmacy Management System
Automated Inventory Monitoring & Alert Service
© ${new Date().getFullYear()} MedCure. All rights reserved.

This is an automated message. Please do not reply to this email.
═══════════════════════════════════════════════════════════════════
      `;

      // Send email alert
      await emailService.send({
        to: emailRecipient,
        subject: `🚨 MedCure Inventory Alert - ${outOfStock.length} Out of Stock, ${lowStock.length} Low Stock`,
        html: emailContent,
        text: plainTextContent,
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
