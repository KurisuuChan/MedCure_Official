import React from "react";
import {
  Package,
  ShoppingCart,
  Bell,
  BarChart3,
  Users,
  Shield,
  Database,
  FileText,
  Clock,
} from "lucide-react";

export default function LearnMore() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <header className="mb-12">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
            MedCure Pro - Features & Capabilities
          </h1>
          <p className="mt-4 text-gray-600 max-w-3xl">
            Discover the comprehensive features of our enterprise-grade pharmacy
            management system. Built with React 19, Vite, and Supabase for
            real-time performance and reliability.
          </p>
        </header>

        {/* Core Features Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          <article className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-600">
            <div className="flex items-center gap-3 mb-3">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold">Professional POS</h3>
            </div>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Real-time stock deduction</li>
              <li>• Multi-unit support (pieces, sheets, boxes)</li>
              <li>• PWD/Senior citizen discounts</li>
              <li>• Multiple payment methods</li>
              <li>• Professional receipt generation</li>
              <li>• Transaction history with edit/undo</li>
            </ul>
          </article>

          <article className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-emerald-600">
            <div className="flex items-center gap-3 mb-3">
              <Package className="w-6 h-6 text-emerald-600" />
              <h3 className="text-lg font-semibold">Inventory Management</h3>
            </div>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Batch tracking with lot numbers</li>
              <li>• Expiry date monitoring (per batch)</li>
              <li>• FIFO inventory management</li>
              <li>• Multi-category organization</li>
              <li>• Smart CSV import with auto-validation</li>
              <li>• Archive system with soft delete</li>
            </ul>
          </article>

          <article className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-orange-600">
            <div className="flex items-center gap-3 mb-3">
              <Bell className="w-6 h-6 text-orange-600" />
              <h3 className="text-lg font-semibold">Smart Notifications</h3>
            </div>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Out-of-stock immediate alerts</li>
              <li>• Low stock warnings (configurable)</li>
              <li>• Expiring products monitoring</li>
              <li>• Email integration via Resend</li>
              <li>• Database deduplication (24hr cooldown)</li>
              <li>• Customizable notification intervals</li>
            </ul>
          </article>
        </section>

        {/* Analytics & Reporting */}
        <section className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-semibold">Analytics & Reporting</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Business Intelligence
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Revenue tracking (daily, monthly, yearly)</li>
                <li>• Real-time dashboard with live KPIs</li>
                <li>• Top products analysis with visual charts</li>
                <li>• Category insights (Pie Chart)</li>
                <li>• Sales trends (Line Chart)</li>
                <li>• Performance metrics and transaction counts</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Financial Reports
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Profit margins and ROI analysis</li>
                <li>• Stock valuation calculations</li>
                <li>• Cost tracking per batch</li>
                <li>• Custom date range filtering</li>
                <li>• PDF and CSV export functionality</li>
                <li>• Inventory reports with stock levels</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Customer & User Management */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-teal-600" />
              <h3 className="text-lg font-semibold">Customer Management</h3>
            </div>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Customer profiles with contact information</li>
              <li>• Walk-in, new, and existing customer support</li>
              <li>• Purchase history tracking</li>
              <li>• Quick customer search by name or phone</li>
              <li>• Customer statistics (transaction count, total spent)</li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-indigo-600" />
              <h3 className="text-lg font-semibold">User & Role Management</h3>
            </div>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Role-Based Access Control (RBAC)</li>
              <li>• Admin, Pharmacist, Employee roles</li>
              <li>• Fine-grained permission system</li>
              <li>• Secure authentication with Supabase Auth</li>
              <li>• Activity tracking and audit logging</li>
            </ul>
          </div>
        </section>

        {/* Technical Stack */}
        <section className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Technical Architecture</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Frontend Stack
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• React 19 - Latest component framework</li>
                <li>• Vite 7 - Lightning-fast build tool</li>
                <li>• Tailwind CSS 4 - Utility-first styling</li>
                <li>• Zustand - Lightweight state management</li>
                <li>• Chart.js - Data visualization</li>
                <li>• React Router DOM 7 - Client-side routing</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Backend Infrastructure
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Supabase - PostgreSQL with real-time</li>
                <li>• Row Level Security (RLS) policies</li>
                <li>• Stored procedures and database functions</li>
                <li>• Real-time subscriptions</li>
                <li>• Automated database triggers</li>
                <li>• Domain-driven service architecture</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Transaction Management */}
        <section className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-semibold">Transaction Management</h2>
          </div>
          <p className="text-sm text-gray-700 mb-4">
            Complete transaction lifecycle with two-phase commit (create →
            complete), edit capabilities within 24 hours, and full audit trail.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 border rounded p-4">
              <div className="font-semibold text-gray-900 mb-2">
                <Clock className="inline w-4 h-4 mr-2" />
                Processing
              </div>
              <p className="text-xs text-gray-600">
                Two-phase commit system ensures data integrity. Create pending
                transactions and complete them with payment confirmation.
              </p>
            </div>
            <div className="bg-gray-50 border rounded p-4">
              <div className="font-semibold text-gray-900 mb-2">
                <FileText className="inline w-4 h-4 mr-2" />
                History
              </div>
              <p className="text-xs text-gray-600">
                Complete sales record with search, filtering, and export to
                CSV/PDF. View detailed transaction information and customer
                data.
              </p>
            </div>
            <div className="bg-gray-50 border rounded p-4">
              <div className="font-semibold text-gray-900 mb-2">
                <Shield className="inline w-4 h-4 mr-2" />
                Audit Trail
              </div>
              <p className="text-xs text-gray-600">
                Full history of edits with reasons and timestamps. Complete
                transaction reversal with automatic stock restoration.
              </p>
            </div>
          </div>
        </section>

        {/* Batch Management Details */}
        <section className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <h2 className="text-xl font-semibold mb-4">
            Batch Management System
          </h2>
          <p className="text-sm text-gray-700 mb-4">
            Advanced batch tracking with FIFO support, expiry monitoring, and
            complete traceability. Each batch includes lot numbers, purchase
            costs, supplier information, and quantity tracking.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Expiry Status Indicators
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
                    Expired
                  </span>
                  <span className="text-sm text-gray-600">
                    Past expiry date
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded">
                    Critical
                  </span>
                  <span className="text-sm text-gray-600">
                    ≤ 30 days to expiry
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">
                    Expiring Soon
                  </span>
                  <span className="text-sm text-gray-600">
                    31-90 days to expiry
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                    Good
                  </span>
                  <span className="text-sm text-gray-600">
                    &gt; 90 days to expiry
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Advanced Filtering
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Filter by expiry status</li>
                <li>• Search by batch/lot number</li>
                <li>• Filter by supplier</li>
                <li>• Category-based filtering</li>
                <li>• Date range queries</li>
                <li>• Quantity threshold filtering</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Security & Compliance */}
        <section className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-red-600" />
            <h2 className="text-xl font-semibold">Security & Compliance</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Security Features
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Row Level Security (RLS) at database level</li>
                <li>• Secure authentication with Supabase Auth</li>
                <li>• Role-based access control</li>
                <li>• Session management with automatic timeout</li>
                <li>• Comprehensive audit logging</li>
                <li>• Data validation and error handling</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Best Practices
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Enable RLS policies on all tables</li>
                <li>• Use encryption-at-rest for database</li>
                <li>• Implement HTTPS/TLS for all traffic</li>
                <li>• Regular database backups and retention</li>
                <li>• Monitor user activity and system logs</li>
                <li>• Enable 2FA for administrative users</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Getting Started */}
        <section className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200 mb-8">
          <h2 className="text-xl font-semibold mb-4">Getting Started</h2>
          <ol className="list-decimal ml-5 text-sm text-gray-700 space-y-2">
            <li>
              <strong>Database Setup:</strong> Create Supabase project and
              configure environment variables
            </li>
            <li>
              <strong>Product Catalog:</strong> Import products via CSV or add
              manually with categories
            </li>
            <li>
              <strong>Batch Management:</strong> Add batches with expiry dates
              and lot numbers
            </li>
            <li>
              <strong>User Setup:</strong> Create user accounts and assign roles
              (Admin, Pharmacist, Employee)
            </li>
            <li>
              <strong>Notification Config:</strong> Configure notification
              intervals and email settings
            </li>
            <li>
              <strong>Staff Training:</strong> Train staff on POS workflows,
              discounts, and transaction management
            </li>
            <li>
              <strong>Go Live:</strong> Enable backups and monitor daily reports
              for the first week
            </li>
          </ol>
        </section>

        {/* CSV Import Information */}
        <section className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <h3 className="text-lg font-semibold mb-3">
            Smart CSV Import & Export
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Intelligent bulk import system with medicine-specific validation,
            auto-creation of categories and dosage forms, and comprehensive
            error reporting.
          </p>

          <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-4">
            <h4 className="font-semibold text-sm text-blue-900 mb-2">
              🎯 Smart Features
            </h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>✓ Auto-creates missing categories and dosage forms</li>
              <li>✓ Flexible field mapping (supports multiple CSV formats)</li>
              <li>
                ✓ Medicine-specific validation (dosage strength, drug
                classification)
              </li>
              <li>
                ✓ Smart unit detection based on dosage form (liquids vs solids)
              </li>
              <li>✓ Flexible date parsing (multiple formats supported)</li>
              <li>✓ Duplicate detection and intelligent merging</li>
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 border rounded p-4">
              <h4 className="font-semibold text-sm mb-2">Product Import</h4>
              <p className="text-xs text-gray-600 mb-2">
                Import products with automatic category creation and validation.
              </p>
              <div className="text-xs text-gray-500">
                <strong>Required:</strong> generic_name
                <br />
                <strong>Optional:</strong> brand_name, category,
                price_per_piece, stock_in_pieces, manufacturer, dosage_strength,
                dosage_form, drug_classification, pieces_per_sheet,
                sheets_per_box
              </div>
            </div>

            <div className="bg-gray-50 border rounded p-4">
              <h4 className="font-semibold text-sm mb-2">Batch Import</h4>
              <p className="text-xs text-gray-600 mb-2">
                Bulk import batches with expiry validation and supplier info.
              </p>
              <div className="text-xs text-gray-500">
                <strong>Required:</strong> product_id, quantity
                <br />
                <strong>Optional:</strong> batch_number, expiry_date,
                cost_per_unit, supplier, purchase_date
              </div>
            </div>
          </div>

          <div className="mt-4 bg-gray-50 border rounded p-4">
            <h4 className="font-semibold text-sm mb-2">
              Supported Dosage Forms
            </h4>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                TABLETS
              </span>
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                CAPSULES
              </span>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                SYRUP
              </span>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                DROPS
              </span>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                SUSPENSION
              </span>
              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                SACHET
              </span>
              <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">
                INHALER
              </span>
              <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">
                NEBULIZER
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              System automatically applies appropriate unit structure based on
              dosage form (e.g., liquids use ml/bottles, solids use
              pieces/sheets/boxes)
            </p>
          </div>

          <div className="mt-6 flex gap-3">
            <a
              href="/inventory"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              Get Started
            </a>
            <a
              href="/login"
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors text-sm"
            >
              Login
            </a>
          </div>
        </section>

        {/* Domain-Driven Architecture */}
        <section className="bg-white p-6 rounded-lg shadow-sm mb-12">
          <h3 className="text-lg font-semibold mb-3">
            Domain-Driven Architecture
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            The system is organized using domain-driven design principles with
            clear separation of concerns across inventory, sales, analytics,
            auth, and notification domains.
          </p>

          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs overflow-auto">
            <pre>{`services/
├── domains/
│   ├── inventory/          # Product, batch, category management
│   │   ├── productService.js
│   │   ├── enhancedBatchService.js
│   │   ├── advancedInventoryService.js
│   │   └── unifiedCategoryService.js
│   ├── sales/             # POS, transactions, revenue
│   │   ├── transactionService.js
│   │   ├── salesService.js
│   │   └── posService.js
│   ├── analytics/         # Dashboards, reports, insights
│   │   ├── dashboardService.js
│   │   ├── analyticsService.js
│   │   └── reportingService.js
│   ├── auth/              # Authentication, user management
│   │   ├── authService.js
│   │   └── userService.js
│   └── notifications/     # Alert system, email notifications
│       └── NotificationService.js
└── core/                  # Shared utilities and helpers`}</pre>
          </div>
        </section>

        <footer className="mt-12 text-center text-sm text-gray-600 border-t pt-8">
          <p className="mb-2">
            <strong>MedCure Pro</strong> - Enterprise-grade pharmacy management
            system
          </p>
          <p>
            Built with React 19, Vite, Supabase, and modern web technologies
          </p>
        </footer>
      </div>
    </div>
  );
}
