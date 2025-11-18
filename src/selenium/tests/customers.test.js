/**
 * Customers Tests
 * Customer management tests
 */

import { describe, it, before, after } from "mocha";
import { expect } from "chai";
import { createDriver, quitDriver } from "../helpers/driver.js";
import { takeScreenshot } from "../helpers/utils.js";
import LoginPage from "../page-objects/LoginPage.js";
import CustomersPage from "../page-objects/CustomersPage.js";

describe("Customer Management", function () {
  this.timeout(30000);

  let driver;
  let loginPage;
  let customersPage;

  before(async function () {
    driver = await createDriver();
    loginPage = new LoginPage(driver);
    customersPage = new CustomersPage(driver);

    await loginPage.loginAsAdmin();
  });

  after(async function () {
    await quitDriver(driver);
  });

  it("should navigate to customers page", async function () {
    await customersPage.open();
    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).to.include("/customers");
    await takeScreenshot(driver, "customers-page");
  });

  it("should display customer list", async function () {
    await driver.sleep(1000);
    await takeScreenshot(driver, "customers-list");
  });
});
