/**
 * POS (Point of Sale) Tests
 * Core POS functionality tests
 */

import { describe, it, before, after } from "mocha";
import { expect } from "chai";
import { createDriver, quitDriver } from "../helpers/driver.js";
import { takeScreenshot } from "../helpers/utils.js";
import LoginPage from "../page-objects/LoginPage.js";
import POSPage from "../page-objects/POSPage.js";

describe("Point of Sale (POS)", function () {
  this.timeout(30000);

  let driver;
  let loginPage;
  let posPage;

  before(async function () {
    driver = await createDriver();
    loginPage = new LoginPage(driver);
    posPage = new POSPage(driver);

    await loginPage.loginAsAdmin();
  });

  after(async function () {
    await quitDriver(driver);
  });

  it("should navigate to POS page", async function () {
    await posPage.open();
    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).to.include("/pos");
    await takeScreenshot(driver, "pos-page");
  });

  it("should display POS interface", async function () {
    await driver.sleep(1000);
    await takeScreenshot(driver, "pos-interface");
  });
});
