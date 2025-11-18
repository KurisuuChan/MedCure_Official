# 🧪 MedCure Selenium Test Suite - Complete Guide

## 📖 Table of Contents

1. [Overview](#overview)
2. [Test Files Created](#test-files-created)
3. [Quick Start](#quick-start)
4. [Test Credentials](#test-credentials)
5. [Running Tests](#running-tests)
6. [Test Coverage](#test-coverage)
7. [Project Structure](#project-structure)
8. [Configuration](#configuration)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

Comprehensive automated end-to-end testing suite for MedCure Pharmacy Management System using:

- **Selenium WebDriver** - Browser automation
- **Mocha** - Test framework
- **Chai** - Assertion library
- **Microsoft Edge** - Browser (Chromium-based)
- **Page Object Model** - Design pattern

---

## 📁 Test Files Created

### Test Files (`src/selenium/tests/`)

| File                   | Description          | Tests |
| ---------------------- | -------------------- | ----- |
| **smoke.test.js**      | Quick smoke tests    | 5     |
| **login.test.js**      | Login functionality  | 3     |
| **navigation.test.js** | App navigation       | 10    |
| **dashboard.test.js**  | Dashboard features   | 5+    |
| **inventory.test.js**  | Inventory management | 8+    |
| **pos.test.js**        | Point of Sale        | 6+    |
| **customers.test.js**  | Customer CRUD        | 5     |
| **suppliers.test.js**  | Supplier CRUD        | 5     |
| **sales.test.js**      | Sales history        | 6     |
| **reports.test.js**    | Reports & analytics  | 7     |
| **settings.test.js**   | App settings         | 6     |

### Page Objects (`src/selenium/page-objects/`)

| File                 | Purpose                     |
| -------------------- | --------------------------- |
| **LoginPage.js**     | Login page interactions     |
| **DashboardPage.js** | Dashboard interactions      |
| **InventoryPage.js** | Inventory page interactions |
| **POSPage.js**       | POS page interactions       |
| **CustomersPage.js** | Customers page interactions |
| **SuppliersPage.js** | Suppliers page interactions |
| **SalesPage.js**     | Sales page interactions     |
| **ReportsPage.js**   | Reports page interactions   |
| **SettingsPage.js**  | Settings page interactions  |

### Utilities

| File                      | Purpose                   |
| ------------------------- | ------------------------- |
| **config/test.config.js** | Test configuration        |
| **helpers/driver.js**     | WebDriver setup           |
| **helpers/utils.js**      | Utility functions         |
| **run-all-tests.js**      | Comprehensive test runner |
| **QUICK_START.js**        | Quick start guide         |

---

## 🚀 Quick Start

### 1. Verify Prerequisites

```bash
# Check if app is running
npm run test:check

# Verify test setup
npm run test:verify

# View quick start guide
node src/selenium/QUICK_START.js
```

### 2. Run Your First Test

```bash
# Start the application (in terminal 1)
npm run dev

# Run smoke tests (in terminal 2)
npm run test:smoke
```

### 3. Run All Tests

```bash
# With browser UI (slower but visual)
npm test

# Headless mode (faster)
npm run test:headless

# With detailed report
npm run test:all
```

---

## 🔐 Test Credentials

All credentials are configured in `src/selenium/config/test.config.js`:

### Default Credentials

```javascript
Admin User:
  Email: admin@medcure.com
  Password: 123456

Staff User:
  Email: staff@medcure.com
  Password: 123456

Cashier User:
  Email: cashier@medcure.com
  Password: 123456
```

### Override with Environment Variables

```bash
# Windows
set TEST_ADMIN_EMAIL=youremail@example.com
set TEST_ADMIN_PASSWORD=yourpassword

# PowerShell
$env:TEST_ADMIN_EMAIL="youremail@example.com"
$env:TEST_ADMIN_PASSWORD="yourpassword"
```

---

## 🧪 Running Tests

### All Tests

```bash
npm test                    # All tests with UI
npm run test:headless       # All tests headless
npm run test:all            # With detailed report
```

### Smoke Tests

```bash
npm run test:smoke          # Quick validation
```

### Feature Tests

```bash
npm run test:login          # Login tests
npm run test:dashboard      # Dashboard tests
npm run test:navigation     # Navigation tests
npm run test:inventory      # Inventory tests
npm run test:pos            # POS tests
npm run test:customers      # Customer tests
npm run test:suppliers      # Supplier tests
npm run test:sales          # Sales tests
npm run test:reports        # Reports tests
npm run test:settings       # Settings tests
```

### Individual Test Files

```bash
# Run any test file directly
npx mocha src/selenium/tests/[filename].test.js --timeout 30000
```

---

## 📊 Test Coverage

### ✅ Comprehensive Test Coverage

#### 1. **Authentication** (login.test.js)

- ✅ Login page loading
- ✅ Invalid credentials handling
- ✅ Successful admin login
- ✅ Error message display

#### 2. **Navigation** (navigation.test.js)

- ✅ Dashboard navigation
- ✅ Inventory navigation
- ✅ POS navigation
- ✅ Customers navigation
- ✅ Suppliers navigation
- ✅ Sales navigation
- ✅ Sidebar navigation
- ✅ Browser back/forward
- ✅ Auth redirect
- ✅ URL routing

#### 3. **Inventory Management** (inventory.test.js)

- ✅ View inventory list
- ✅ Add new product
- ✅ Search products
- ✅ Edit product
- ✅ Update stock
- ✅ Filter inventory
- ✅ Low stock alerts
- ✅ Form validation

#### 4. **Point of Sale** (pos.test.js)

- ✅ Load POS interface
- ✅ Product search
- ✅ Add to cart
- ✅ Remove from cart
- ✅ Process sale
- ✅ Receipt generation

#### 5. **Customer Management** (customers.test.js)

- ✅ Navigate to customers
- ✅ Open add modal
- ✅ Create customer
- ✅ Search customers
- ✅ Form validation

#### 6. **Supplier Management** (suppliers.test.js)

- ✅ Navigate to suppliers
- ✅ Open add modal
- ✅ Create supplier
- ✅ Search suppliers
- ✅ Form validation

#### 7. **Sales History** (sales.test.js)

- ✅ View sales list
- ✅ Search sales
- ✅ Filter by date
- ✅ View details
- ✅ Export reports

#### 8. **Reports & Analytics** (reports.test.js)

- ✅ Sales reports
- ✅ Inventory reports
- ✅ Financial reports
- ✅ Date filtering
- ✅ Export functionality
- ✅ Print functionality

#### 9. **Settings** (settings.test.js)

- ✅ Navigate to settings
- ✅ Business settings
- ✅ Update business name
- ✅ Notification settings
- ✅ User management
- ✅ System preferences

---

## 🏗️ Project Structure

```
src/selenium/
│
├── 📂 config/
│   └── test.config.js              # Central configuration
│
├── 📂 helpers/
│   ├── driver.js                   # WebDriver setup & management
│   └── utils.js                    # Utility functions
│
├── 📂 page-objects/
│   ├── LoginPage.js                # Login page model
│   ├── DashboardPage.js            # Dashboard page model
│   ├── InventoryPage.js            # Inventory page model
│   ├── POSPage.js                  # POS page model
│   ├── CustomersPage.js            # Customers page model
│   ├── SuppliersPage.js            # Suppliers page model
│   ├── SalesPage.js                # Sales page model
│   ├── ReportsPage.js              # Reports page model
│   └── SettingsPage.js             # Settings page model
│
├── 📂 tests/
│   ├── smoke.test.js               # Smoke tests
│   ├── login.test.js               # Login tests
│   ├── navigation.test.js          # Navigation tests
│   ├── dashboard.test.js           # Dashboard tests
│   ├── inventory.test.js           # Inventory tests
│   ├── pos.test.js                 # POS tests
│   ├── customers.test.js           # Customer tests
│   ├── suppliers.test.js           # Supplier tests
│   ├── sales.test.js               # Sales tests
│   ├── reports.test.js             # Reports tests
│   ├── settings.test.js            # Settings tests
│   ├── diagnostics.test.js         # Diagnostic tests
│   └── README.md                   # Tests documentation
│
├── 📂 screenshots/                 # Auto-generated screenshots
├── 📂 reports/                     # Test reports
│
├── run-all-tests.js                # Test runner with reporting
├── QUICK_START.js                  # Quick start guide
├── README.md                       # Main documentation
└── SELENIUM_TEST_SUITE.md          # This file
```

---

## ⚙️ Configuration

### Test Configuration (`src/selenium/config/test.config.js`)

```javascript
{
  baseUrl: "http://localhost:5173",
  browser: {
    name: "edge",
    headless: false,
    windowSize: { width: 1920, height: 1080 }
  },
  timeouts: {
    implicit: 10000,
    explicit: 20000,
    pageLoad: 30000,
    script: 15000
  },
  screenshots: {
    enabled: true,
    onFailure: true,
    directory: "./selenium/screenshots"
  }
}
```

### Environment Variables

| Variable              | Description     | Default               |
| --------------------- | --------------- | --------------------- |
| `TEST_BASE_URL`       | Application URL | http://localhost:5173 |
| `BROWSER`             | Browser to use  | edge                  |
| `HEADLESS`            | Headless mode   | false                 |
| `TEST_ADMIN_EMAIL`    | Admin email     | admin@medcure.com     |
| `TEST_ADMIN_PASSWORD` | Admin password  | 123456                |

---

## 🐛 Troubleshooting

### Common Issues & Solutions

#### 1. **EdgeDriver Version Mismatch**

```bash
npm install --save-dev edgedriver@latest
```

#### 2. **Application Not Running**

```bash
# Check if app is running
npm run test:check

# Start the app
npm run dev
```

#### 3. **Element Not Found**

- Increase timeout in `test.config.js`
- Check if page structure changed
- Run diagnostic tools:
  ```bash
  npm run test:inspect
  ```

#### 4. **Screenshots Not Saving**

```bash
# Create directory manually
mkdir selenium\screenshots

# Check permissions
```

#### 5. **Tests Timing Out**

```bash
# Increase timeout for specific test
this.timeout(60000); // 60 seconds

# Or run in headless mode (faster)
npm run test:headless
```

#### 6. **Browser Not Found**

- Ensure Microsoft Edge is installed
- Update Edge to latest version
- Try alternative browser in config

---

## 📸 Screenshots

### Automatic Screenshots

Screenshots are saved automatically:

- ✅ After each test step
- ✅ On test failure
- ✅ On explicit trigger

### Location

```
selenium/screenshots/
├── smoke-home-page_1234567890.png
├── login-admin-success_1234567891.png
├── nav-dashboard_1234567892.png
└── ...
```

### Naming Convention

```
{test-name}_{timestamp}.png
```

---

## 📊 Test Reports

### JSON Reports

Run comprehensive tests to generate reports:

```bash
npm run test:all
```

Reports saved to:

```
selenium/reports/test-report-{timestamp}.json
```

### Report Contents

```json
{
  "timestamp": "2025-11-17T...",
  "summary": {
    "totalPassed": 45,
    "totalFailed": 0,
    "totalSkipped": 2,
    "allPassed": true
  },
  "results": [...]
}
```

---

## 🔄 Continuous Integration

### CI/CD Integration

```bash
# In your CI pipeline
set HEADLESS=true
npm run test:all
```

### GitHub Actions Example

```yaml
- name: Run Selenium Tests
  run: |
    npm run dev &
    sleep 10
    npm run test:headless
```

---

## 📝 Writing New Tests

### Test Template

```javascript
import { describe, it, before, after, beforeEach } from "mocha";
import { expect } from "chai";
import { createDriver, quitDriver } from "../helpers/driver.js";
import { takeScreenshot } from "../helpers/utils.js";
import LoginPage from "../page-objects/LoginPage.js";

describe("My Feature Tests", function () {
  this.timeout(30000);

  let driver;
  let loginPage;

  before(async function () {
    driver = await createDriver();
    loginPage = new LoginPage(driver);
  });

  after(async function () {
    await quitDriver(driver);
  });

  beforeEach(async function () {
    await loginPage.loginAsAdmin();
    await driver.sleep(2000);
  });

  it("should perform expected action", async function () {
    // Your test code here
    expect(true).to.be.true;
    await takeScreenshot(driver, "my-feature-test");
  });
});
```

### Page Object Template

```javascript
import { By } from "selenium-webdriver";
import { config } from "../config/test.config.js";
import { waitForElement, clickButtonByText } from "../helpers/utils.js";

export class MyPage {
  constructor(driver) {
    this.driver = driver;
    this.url = `${config.baseUrl}/mypage`;

    this.locators = {
      myButton: By.xpath('//button[contains(., "Click Me")]'),
      myInput: By.css('input[name="myfield"]'),
    };
  }

  async open() {
    await this.driver.get(this.url);
    await this.driver.sleep(2000);
  }

  async clickMyButton() {
    await clickButtonByText(this.driver, "Click Me", 5000);
  }
}

export default MyPage;
```

---

## 🎯 Best Practices

### ✅ DO

- Use Page Object Model pattern
- Add screenshots for debugging
- Use descriptive test names
- Handle async/await properly
- Clean up after tests
- Use proper assertions
- Set appropriate timeouts
- Handle errors gracefully

### ❌ DON'T

- Hard-code waits (use explicit waits)
- Mix test logic with page objects
- Skip error handling
- Forget to quit driver
- Use `sleep()` excessively
- Leave commented code
- Commit sensitive data

---

## 📚 Resources

### Documentation

- [Selenium WebDriver Docs](https://www.selenium.dev/documentation/webdriver/)
- [Mocha Testing Framework](https://mochajs.org/)
- [Chai Assertion Library](https://www.chaijs.com/)

### Project Files

- `src/selenium/README.md` - Main README
- `src/selenium/tests/README.md` - Tests README
- `src/selenium/QUICK_START.js` - Quick start guide
- This file - Complete guide

---

## 🤝 Contributing

When adding new tests:

1. Create test file in `src/selenium/tests/`
2. Create page object in `src/selenium/page-objects/`
3. Follow existing patterns
4. Add proper documentation
5. Update this file
6. Test your tests!

---

## ✨ Summary

You now have a **complete, production-ready Selenium test suite** with:

- ✅ **60+ automated tests** across 11 test files
- ✅ **9 page object models** following best practices
- ✅ **Comprehensive test coverage** for all major features
- ✅ **Utility functions** for common operations
- ✅ **Configurable** via environment variables
- ✅ **Screenshot capability** for debugging
- ✅ **Test reporting** with JSON output
- ✅ **Documentation** for easy onboarding

---

**Created:** November 17, 2025  
**Testing Framework:** Selenium WebDriver + Mocha + Chai  
**Browser:** Microsoft Edge (Chromium)  
**Pattern:** Page Object Model  
**Status:** ✅ Production Ready
