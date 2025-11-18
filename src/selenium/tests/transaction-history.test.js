/**
 * Transaction History Tests
 * View transaction/sales history
 */

import { describe, it, before, after } from "mocha";
import { expect } from "chai";
import { createDriver, quitDriver } from "../helpers/driver.js";
import { takeScreenshot } from "../helpers/utils.js";
import LoginPage from "../page-objects/LoginPage.js";
import TransactionHistoryPage from "../page-objects/TransactionHistoryPage.js";

describe("Transaction History", function () {
  this.timeout(30000);

  let driver;
  let loginPage;
  let transactionPage;

  before(async function () {
    driver = await createDriver();
    loginPage = new LoginPage(driver);
    transactionPage = new TransactionHistoryPage(driver);

    await loginPage.loginAsAdmin();
  });

  after(async function () {
    await quitDriver(driver);
  });

  it("should navigate to transaction history page", async function () {
    await transactionPage.open();
    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).to.include("/transaction-history");
    await takeScreenshot(driver, "transaction-history-page");
  });

  it("should display transaction history", async function () {
    await driver.sleep(1000);
    await takeScreenshot(driver, "transaction-history");
  });
});
