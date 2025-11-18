# 🎯 Quick Start - Selenium Testing (UPDATED - All Tests Fixed ✅)

## ✅ What's New

**All test files have been fixed to match your actual MedCure system!**

**Fixed Issues:**

- ✓ Sales route changed from `/sales` to `/transaction-history`
- ✓ Settings route updated to `/system-settings`
- ✓ Disabled suppliers tests (page doesn't exist)
- ✓ Disabled reports tests (page doesn't exist)
- ✓ Fixed E2E demo workflow
- ✓ Updated navigation tests

See `SELENIUM_TEST_FIXES.md` for complete details.

---

## Setup (One-Time)

1. **Ensure Microsoft Edge browser is installed**

2. **Install dependencies** (already done):

   ```bash
   npm install
   ```

3. **Start your application**:

   ```bash
   npm run dev
   ```

   Application should be running on http://localhost:5173

4. **Test Credentials**:
   - Email: `admin@medcure.com`
   - Password: `123456`

---

## Run Tests

Open a **new terminal** and run:

### Run all tests

```bash
npm test
```

### Run tests without browser window (faster)

```bash
npm run test:headless
```

### Run specific test suites

```bash
npm run test:login      # Login tests only
npm run test:dashboard  # Dashboard tests only
npm run test:inventory  # Inventory tests only
```

## View Results

- ✅ **Console**: Shows pass/fail status
- 📸 **Screenshots**: Check `selenium/screenshots/` folder

## Test User Credentials

Update these in `selenium/config/test.config.js`:

```javascript
testUsers: {
  admin: {
    email: 'admin@medcure.com',
    password: 'admin123'
  },
  staff: {
    email: 'staff@medcure.com',
    password: 'staff123'
  }
}
```

## Common Issues

### "ChromeDriver version mismatch"

```bash
npm install --save-dev chromedriver@latest
```

### "Connection refused"

Make sure your app is running first:

```bash
npm run dev
```

### Tests are slow

Use headless mode:

```bash
npm run test:headless
```

## What's Being Tested?

✅ User login/logout  
✅ Dashboard navigation  
✅ Inventory management  
✅ Form validation  
✅ Page navigation

---

📖 **For detailed guide**, see [SELENIUM_TESTING_GUIDE.md](./SELENIUM_TESTING_GUIDE.md)
