# MedCure - Selenium Test Suite

Clean, essential tests for the MedCure pharmacy management system.

## 🎯 Test Files (7 Total)

### Core Tests

1. **login.test.js** - Authentication tests
2. **dashboard.test.js** - Dashboard functionality
3. **inventory.test.js** - Inventory management
4. **pos.test.js** - Point of Sale
5. **customers.test.js** - Customer management
6. **transaction-history.test.js** - Transaction history
7. **e2e-workflow.test.js** - Complete system workflow

## 🚀 Quick Start

### 1. Start MedCure

```bash
npm run dev
```

App runs on: `http://localhost:5173`

### 2. Run Tests

**All Tests:**

```bash
npm run test:all
```

**E2E Workflow (Recommended):**

```bash
npm run test:e2e
```

**Individual Tests:**

```bash
npm run test:login
npm run test:dashboard
npm run test:inventory
npm run test:pos
npm run test:customers
npm run test:transactions
```

## 📋 Prerequisites

- Microsoft Edge browser installed
- MedCure app running on port 5173
- Admin credentials: `admin@medcure.com` / `123456`

## 📸 Screenshots

All screenshots saved to: `selenium/screenshots/`

## ✅ What's Tested

- ✅ Login/Authentication
- ✅ Dashboard navigation
- ✅ Inventory page
- ✅ POS system
- ✅ Customer management
- ✅ Transaction history
- ✅ Complete workflow

## 🗂️ Page Objects

Clean page objects for actual MedCure pages:

- LoginPage.js
- DashboardPage.js
- InventoryPage.js
- POSPage.js
- CustomersPage.js
- TransactionHistoryPage.js

## 🎓 Test Credentials

**Admin:**

- Email: `admin@medcure.com`
- Password: `123456`

**Base URL:** `http://localhost:5173`

---

_Clean, simple, and focused on what actually exists in MedCure._
