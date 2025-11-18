# E2E Workflow Test - Professional Implementation

## Overview

Comprehensive end-to-end Selenium test for MedCure pharmacy system following professional testing best practices with 16 organized steps across 5 phases.

## Professional Test Workflow (16 Steps)

### 🔐 PHASE 1: AUTHENTICATION & ACCESS (Steps 1-3)

**Purpose**: Validate authentication security and system access

1. **Step 1: Failed Login Test**

   - Tests negative scenario with wrong password
   - Verifies error handling and security
   - Screenshot: `e2e-01-failed-login.png`

2. **Step 2: Successful Login**

   - Logs in with valid admin credentials
   - Verifies authentication flow
   - Screenshot: `e2e-02-login-success.png`

3. **Step 3: Dashboard Access**
   - Confirms dashboard loads correctly
   - Verifies user has proper access
   - Screenshot: `e2e-03-dashboard.png`

### 📦 PHASE 2: DATA SETUP (Steps 4-7)

**Purpose**: Create prerequisite data for business operations

4. **Step 4: Add Product**

   - Adds new product (Paracetamol/Biogesic by Unilab)
   - Fields: Generic Name, Brand, Manufacturer, Unit Price, Stock, Batch
   - Uses unique batch number with timestamp
   - Screenshots: `e2e-04-product-form-filled.png`, `e2e-04-before-submit.png`, `e2e-04-product-added.png`

5. **Step 5: Verify Product**

   - Searches for product in inventory
   - Confirms product appears correctly
   - Screenshot: `e2e-05-product-verified.png`

6. **Step 6: Add Customer**

   - Creates new customer (Maria Santos)
   - Uses unique phone and email with timestamp
   - Screenshots: `e2e-06-customer-form-filled.png`, `e2e-06-before-submit.png`, `e2e-06-customer-added.png`

7. **Step 7: Verify Customer**
   - Searches for customer in customer list
   - Confirms customer appears correctly
   - Screenshot: `e2e-07-customer-verified.png`

### 💰 PHASE 3: BUSINESS OPERATIONS (Steps 8-11)

**Purpose**: Execute core pharmacy workflow

8. **Step 8: Navigate to POS and Search**

   - Opens point-of-sale interface
   - Searches for the product created in Step 4
   - Screenshot: `e2e-08-product-search.png`

9. **Step 9: Add to Cart**

   - Clicks product card to open "Select Purchase Unit" modal
   - Adds product to cart
   - Screenshots: `e2e-09-purchase-unit-modal.png`, `e2e-09-cart-with-items.png`

10. **Step 10: Apply Discount**

    - Applies 10% discount to sale
    - Screenshot: `e2e-10-discount-applied.png`

11. **Step 11: Process Payment**
    - Clicks "Checkout" button
    - Handles payment modal
    - Clicks "Complete Payment" button
    - Waits for transaction completion
    - Screenshots: `e2e-11-checkout-modal.png`, `e2e-11-payment-complete.png`

### 📋 PHASE 4: VERIFICATION & REPORTING (Steps 12-14)

**Purpose**: Verify transactions and generate reports

12. **Step 12: Verify Transaction**

    - Opens transaction history
    - Confirms transaction appears
    - Screenshot: `e2e-12-transactions.png`

13. **Step 13: View Receipt**

    - Clicks on transaction or "View" button
    - Opens receipt details modal
    - Screenshot: `e2e-13-receipt-details.png`

14. **Step 14: Print Report**
    - Looks for Print/Download/Export button
    - Triggers report generation
    - Screenshot: `e2e-14-print-report.png`

### 🔄 PHASE 5: CLEANUP (Steps 15-16)

**Purpose**: Complete test execution and generate summary

15. **Step 15: Return to Dashboard**

    - Navigates back to main dashboard
    - Confirms navigation works
    - Screenshot: `e2e-15-final-dashboard.png`

16. **Step 16: Generate Summary**
    - Displays comprehensive test report
    - Shows all 16 steps with status
    - Organized by 5 phases

## Test Execution Flow

```
PHASE 1: AUTHENTICATION & ACCESS
├── Test negative scenario (security)
├── Test positive scenario (access)
└── Verify system entry point

PHASE 2: DATA SETUP
├── Create product (with verification)
└── Create customer (with verification)

PHASE 3: BUSINESS OPERATIONS
├── Search and select product
├── Add to cart
├── Apply pricing rules
└── Complete payment

PHASE 4: VERIFICATION & REPORTING
├── Audit transaction history
├── Review receipt details
└── Generate reports

PHASE 5: CLEANUP
├── Return to starting point
└── Document test results
```

## Technical Implementation

### Form Filling Pattern

```javascript
await field.click();
await driver.sleep(200);
await field.clear();
await field.sendKeys(value);
await driver.sleep(800);
```

### Button Clicking Strategy

```javascript
// Primary: XPath with exclusion
By.xpath(
  '//button[contains(text(), "Add Product") and not(contains(text(), "Cancel"))]'
);

// Secondary: Scroll into view
await driver.executeScript(
  "arguments[0].scrollIntoView({block: 'center'});",
  button
);

// Fallback: Helper function
await clickButtonByText(driver, "Button Text", 10000);
```

### Modal Handling

- **Purchase Unit Modal**: Product selection in POS
- **Payment Modal**: "Complete Payment" button handling
- **Receipt Modal**: Transaction details viewing

## Test Data Strategy

All data uses timestamps to ensure uniqueness:

- **Product**: Paracetamol (Biogesic), Unilab, ₱25.50, Batch BT{timestamp}
- **Customer**: Maria Santos, 09{timestamp-9digits}, maria.santos{timestamp}@email.com
- **Sale**: 1 item with 10% discount

## Running the Test

```bash
# Run all tests
npm test

# Run specific E2E test
npm run test:e2e

# Run with verbose output
npm test -- --grep "E2E"
```

## Expected Results

### Success Criteria

✅ All 16 steps pass without errors  
✅ All 25+ screenshots captured  
✅ Transaction appears in history  
✅ Receipt viewable  
✅ Report generation works

### Execution Time

⏱️ Approximately 2-3 minutes for complete workflow

### Screenshots Generated

25+ screenshots across all phases:

- **Phase 1**: 3 screenshots (login flow)
- **Phase 2**: 8 screenshots (data setup with verification)
- **Phase 3**: 6 screenshots (business operations)
- **Phase 4**: 6 screenshots (verification & reporting)
- **Phase 5**: 2 screenshots (cleanup & summary)

## Test Coverage

### Functional Coverage

- ✅ Authentication (positive & negative)
- ✅ Authorization (admin access)
- ✅ CRUD Operations (products, customers)
- ✅ Business Logic (sales, discounts, payments)
- ✅ Data Validation (form fields, search)
- ✅ Workflow Integration (end-to-end process)
- ✅ Audit Trail (transaction history)
- ✅ Reporting (receipts, exports)

### Technical Coverage

- ✅ Form submissions with validation
- ✅ Modal dialog handling
- ✅ Dynamic content loading
- ✅ Search functionality
- ✅ Navigation flow
- ✅ Button state handling
- ✅ Error handling and recovery

## Troubleshooting

### Common Issues

**Test fails at login:**

- Verify app is running on `http://localhost:5173`
- Check credentials: admin@medcure.com / 123456

**Products/Customers not adding:**

- Check console for form validation errors
- Review screenshots in `selenium/screenshots/`
- Ensure all required fields are filled

**Payment not completing:**

- Verify cart has items
- Check for modal visibility
- Review payment modal screenshots

**Transaction not appearing:**

- Ensure payment completed successfully
- Wait for transaction to process (4s delay)
- Check transaction history page loads

### Debug Steps

1. Check screenshots for visual confirmation
2. Review console output for detailed error messages
3. Verify wait times are sufficient for your system
4. Check network tab for API failures
5. Ensure modals are properly closed between steps

## Best Practices Implemented

1. **Professional Organization**: Tests grouped into logical phases
2. **Data Validation**: Each create operation followed by verification
3. **Unique Test Data**: Timestamp-based to avoid conflicts
4. **Comprehensive Logging**: Detailed console output for debugging
5. **Visual Verification**: Screenshots at every critical step
6. **Error Handling**: Try-catch blocks with error screenshots
7. **Realistic Flow**: Follows actual user journey
8. **Proper Waits**: Appropriate delays for UI rendering
9. **Fallback Strategies**: Multiple approaches for button clicking
10. **Clear Documentation**: Organized summary at test completion

## Maintenance Notes

### Updating Test Data

Modify `testSession` object in test file to change default values while maintaining uniqueness strategy.

### Adding New Steps

Insert between phases or add new phase following the current structure:

1. Add step with proper number
2. Update phase documentation
3. Add appropriate screenshots
4. Update summary in Step 16

### Modifying Selectors

If UI changes, update selectors in:

- Page object files (`page-objects/`)
- Direct XPath in test file
- Helper functions (`helpers/utils.js`)

---

**Last Updated**: November 18, 2025  
**Test Version**: 2.0 - Professional Organization  
**Total Steps**: 16 across 5 phases  
**Execution Time**: ~2-3 minutes

### 🔐 Authentication Testing

1. **Step 1: Failed Login Test**

   - Tests negative scenario with wrong password
   - Verifies error handling
   - Screenshot: `e2e-01-failed-login.png`

2. **Step 2: Successful Login**
   - Logs in with admin credentials
   - Screenshot: `e2e-02-login-success.png`

### 📊 Dashboard & Inventory

3. **Step 3: Dashboard Access**

   - Verifies dashboard loads correctly
   - Screenshot: `e2e-03-dashboard.png`

4. **Step 4: Add Product**

   - Adds new product (Paracetamol/Biogesic by Unilab)
   - Fields filled: Generic Name, Brand Name, Manufacturer, Unit Price, Current Stock, Batch Number
   - Uses unique batch number with timestamp
   - Screenshots: `e2e-04-product-form-filled.png`, `e2e-04-before-submit.png`, `e2e-04-product-added.png`

5. **Step 5: Verify Product**
   - Confirms product appears in inventory
   - Screenshot: `e2e-05-product-verified.png`

### 👥 Customer Management

6. **Step 6: Add Customer**
   - Creates new customer (Maria Santos)
   - Unique phone number and email with timestamp
   - Screenshots: `e2e-06-customer-form-filled.png`, `e2e-06-before-submit.png`, `e2e-06-customer-added.png`

### 💰 Sales Processing

7. **Step 7: Create Sale (POS)**

   - Searches for product
   - Handles "Select Purchase Unit" modal
   - Adds 5 pieces to cart
   - Screenshots: `e2e-07-product-search.png`, `e2e-07-purchase-unit-modal.png`, `e2e-07-cart-with-items.png`

8. **Step 8: Apply Discount**

   - Applies 10% discount to sale
   - Screenshot: `e2e-08-discount-applied.png`

9. **Step 9: Complete Payment**
   - Clicks "Checkout" button
   - Handles payment modal
   - Clicks "Complete Payment" button (green button)
   - Waits for transaction completion
   - Screenshots: `e2e-09-checkout-modal.png`, `e2e-09-payment-complete.png`

### 📋 Transaction Management & Reporting

10. **Step 10: Verify Transaction**

    - Opens transaction history
    - Confirms transaction appears
    - Screenshot: `e2e-10-transactions.png`

11. **Step 11: View Receipt Details**

    - Clicks on transaction or "View" button
    - Opens receipt details modal
    - Screenshot: `e2e-11-receipt-details.png`

12. **Step 12: Print Report**

    - Looks for Print/Download/Export button
    - Triggers report generation
    - Screenshot: `e2e-12-print-report.png`

13. **Step 13: Return to Dashboard**

    - Navigates back to dashboard
    - Screenshot: `e2e-13-final-dashboard.png`

14. **Step 14: Generate Summary**
    - Displays comprehensive test report
    - Lists all completed steps

## Form Filling Pattern

All form fields use this reliable pattern:

```javascript
await field.click();
await driver.sleep(200);
await field.clear();
await field.sendKeys(value);
await driver.sleep(800);
```

## Button Clicking Strategy

For submit buttons (Add Product, Create Customer, etc.):

1. **XPath with exclusion**: `'//button[contains(text(), "Add Product") and not(contains(text(), "Cancel"))]'`
2. **Scroll into view**: Centers button in viewport
3. **Fallback**: Uses `clickButtonByText` helper with 10s timeout

## Modal Handling

- **Purchase Unit Modal**: Handles product selection in POS
- **Payment Modal**: Handles "Complete Payment" button after checkout
- **Receipt Modal**: Opens transaction details for viewing

## Test Data

All test data includes timestamps to avoid conflicts:

- **Product**: Paracetamol (Biogesic), Unilab, ₱25.50, Batch BT{timestamp}
- **Customer**: Maria Santos, 09{timestamp-9digits}, maria.santos{timestamp}@email.com
- **Sale**: 5 pieces with 10% discount

## Running the Test

```bash
npm test
```

Or run specifically:

```bash
npm run test:e2e
```

## Expected Screenshots

Total: 20+ screenshots covering all steps and modals:

- e2e-01-failed-login.png
- e2e-02-login-success.png
- e2e-03-dashboard.png
- e2e-04-product-form-filled.png
- e2e-04-before-submit.png
- e2e-04-product-added.png
- e2e-05-product-verified.png
- e2e-06-customer-form-filled.png
- e2e-06-before-submit.png
- e2e-06-customer-added.png
- e2e-07-product-search.png
- e2e-07-purchase-unit-modal.png
- e2e-07-cart-with-items.png
- e2e-08-discount-applied.png
- e2e-09-checkout-modal.png
- e2e-09-payment-complete.png
- e2e-10-transactions.png
- e2e-11-receipt-details.png
- e2e-12-print-report.png
- e2e-13-final-dashboard.png

## Test Coverage

✅ Authentication (positive & negative scenarios)  
✅ Dashboard navigation  
✅ Inventory management (add products)  
✅ Customer management (add customers)  
✅ Point-of-Sale (product search, cart)  
✅ Discount application  
✅ Payment processing with modal  
✅ Transaction history  
✅ Receipt viewing  
✅ Report generation

## Key Features

- **Comprehensive Coverage**: Tests complete pharmacy workflow from login to reporting
- **Unique Test Data**: Timestamp-based data prevents test conflicts
- **Multiple Strategies**: Fallback mechanisms for button clicking and modal handling
- **Visual Verification**: Screenshots at every critical step
- **Error Handling**: Try-catch blocks with error screenshots
- **Real User Flow**: Follows actual pharmacy operations sequence

## Troubleshooting

If tests fail:

1. Check app is running on `http://localhost:5173`
2. Verify credentials: admin@medcure.com / 123456
3. Review screenshots in `selenium/screenshots/`
4. Check console output for detailed error messages
5. Ensure all modals close properly between steps
