/**
 * Dashboard Tests
 * Core dashboard functionality tests
 */

import { describe, it, before, after } from "mocha";
import { expect } from "chai";
import { createDriver, quitDriver } from "../helpers/driver.js";
import { takeScreenshot } from "../helpers/utils.js";
import LoginPage from "../page-objects/LoginPage.js";
import DashboardPage from "../page-objects/DashboardPage.js";

describe("Dashboard Page", function () {
  this.timeout(30000);

  let driver;
  let loginPage;
  let dashboardPage;

  before(async function () {
    driver = await createDriver();
    loginPage = new LoginPage(driver);
    dashboardPage = new DashboardPage(driver);

    await loginPage.loginAsAdmin();
  });

  after(async function () {
    await quitDriver(driver);
  });

  it("should navigate to dashboard", async function () {
    await dashboardPage.open();
    const isLoaded = await dashboardPage.isLoaded();
    expect(isLoaded).to.be.true;
    await takeScreenshot(driver, "dashboard-loaded");
  });

  it("should display dashboard content", async function () {
    await driver.sleep(1000);
    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).to.include("/dashboard");
    await takeScreenshot(driver, "dashboard-content");
  });
});
