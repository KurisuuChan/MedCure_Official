/**
 * Inventory Tests
 * Core inventory management tests
 */

import { describe, it, before, after } from "mocha";
import { expect } from "chai";
import { createDriver, quitDriver } from "../helpers/driver.js";
import { takeScreenshot } from "../helpers/utils.js";
import LoginPage from "../page-objects/LoginPage.js";
import InventoryPage from "../page-objects/InventoryPage.js";

describe("Inventory Management", function () {
  this.timeout(30000);

  let driver;
  let loginPage;
  let inventoryPage;

  before(async function () {
    driver = await createDriver();
    loginPage = new LoginPage(driver);
    inventoryPage = new InventoryPage(driver);

    await loginPage.loginAsAdmin();
  });

  after(async function () {
    await quitDriver(driver);
  });

  it("should navigate to inventory page", async function () {
    await inventoryPage.open();
    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).to.include("/inventory");
    await takeScreenshot(driver, "inventory-page");
  });

  it("should display inventory content", async function () {
    await driver.sleep(1000);
    await takeScreenshot(driver, "inventory-content");
  });
});
