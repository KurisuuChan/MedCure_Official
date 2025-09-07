# Medcure Pharmacy Management System

A modern, full-stack pharmacy management system built with React, Vite, Tailwind CSS, and Supabase.

## 🚀 Features

### Core Functionality

- **Dashboard** - Overview of pharmacy operations with analytics
- **Inventory Management** - Product management with health status indicators
- **Point of Sale (POS)** - Transaction processing with offline capabilities
- **Reports** - Sales analytics and business insights
- **User Management** - Role-based access control

### Key Highlights

- **Role-Based Access Control (RBAC)** - Admin, Pharmacist, and Cashier roles
- **Offline-First POS** - Continues working without internet connection
- **Real-time Analytics** - Live dashboard with sales and inventory data
- **Responsive Design** - Works perfectly on desktop, tablet, and mobile
- **Modern UI** - Clean, professional interface with Tailwind CSS

## 🛠️ Technology Stack

### Frontend

- **React 19** - Modern React with latest features
- **Vite** - Ultra-fast build tool and dev server
- **Tailwind CSS 4** - Utility-first CSS framework
- **React Router** - Client-side routing
- **TanStack Query** - Server state management
- **Zustand** - Lightweight state management
- **Lucide React** - Beautiful icons

### Backend

- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Robust relational database
- **Row Level Security (RLS)** - Database-level security
- **Real-time subscriptions** - Live data updates

### Development Tools

- **ESLint** - Code linting
- **React Query Devtools** - Development debugging
- **Hot Module Replacement** - Instant development feedback

## 📦 Installation

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account

### Setup Steps

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd medcure-pharmacy
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Update `.env` with your Supabase credentials:

   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up the database**

   - Create a new Supabase project
   - Run the `database_setup.sql` script in the Supabase SQL editor
   - Create test user accounts in Supabase Auth:
     - admin@medcure.com (password: medcure123)
     - pharmacist@medcure.com (password: medcure123)
     - cashier@medcure.com (password: medcure123)

5. **Start the development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**
   - Navigate to `http://localhost:5173`
   - Log in with one of the test accounts

## 🗃️ Database Schema

### Core Tables

- **categories** - Product categories
- **products** - Inventory items with stock tracking
- **user_profiles** - Extended user information with roles
- **sales** - Transaction records
- **sale_items** - Individual items within transactions
- **audit_logs** - System activity tracking

### Key Features

- **Automatic batch number generation**
- **Stock level tracking with alerts**
- **Expiry date monitoring**
- **Atomic transaction processing**
- **Complete audit trail**

## 🎯 User Roles & Permissions

### Admin

- Full system access
- User management
- All inventory operations
- Sales voiding and refunds
- System settings

### Pharmacist

- Inventory management
- Product operations
- Sales processing
- Sales voiding
- Reports access

### Cashier

- Point of sale operations
- Basic inventory viewing
- Customer transactions
- Limited dashboard access

## 🖥️ Page Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── FullLayout.jsx
│   │   ├── Sidebar.jsx
│   │   └── Header.jsx
│   ├── ui/
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── Card.jsx
│   │   ├── Badge.jsx
│   │   └── LoadingSpinner.jsx
│   └── ProtectedRoute.jsx
├── contexts/
│   └── AuthContext.jsx
├── hooks/
│   └── useAuth.js
├── lib/
│   └── supabase.js
├── pages/
│   ├── Dashboard.jsx
│   ├── Management.jsx
│   ├── POS.jsx
│   ├── Reports.jsx
│   ├── Settings.jsx
│   └── LoginPage.jsx
└── App.jsx
```

## 🔧 Development Guidelines

### Code Style

- Use functional components with hooks
- Follow React best practices
- Implement proper error handling
- Use TypeScript-style JSDoc comments

### State Management

- Server state: TanStack Query
- UI state: Zustand stores
- Authentication: React Context

### Styling

- Utility-first approach with Tailwind
- Custom CSS variables for theming
- Responsive design mobile-first
- Consistent component patterns

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Vercel/Netlify

1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically on push

### Environment Variables for Production

```env
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_anon_key
VITE_APP_NAME=Medcure Pharmacy
VITE_APP_VERSION=1.0.0
```

## 📈 Future Enhancements

### Planned Features

- **Supplier Management** - Track vendor information
- **Purchase Orders** - Inventory replenishment workflow
- **Multi-location Support** - Manage multiple pharmacy branches
- **Barcode Scanning** - Quick product identification
- **Advanced Analytics** - Profit tracking and forecasting
- **API Integration** - Connect with external systems

### Technical Improvements

- **Progressive Web App (PWA)** - Offline functionality
- **Real-time Notifications** - Live system alerts
- **Advanced Testing** - Unit and integration tests
- **Performance Monitoring** - Analytics and error tracking
- **Multi-language Support** - Internationalization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 💬 Support

For support and questions:

- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation

---

**Built with ❤️ for modern pharmacy management**+ Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
