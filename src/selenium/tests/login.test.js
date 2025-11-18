/**
 * Login Tests
 * Essential authentication tests
 */

import { describe, it, before, after } from "mocha";
import { expect } from "chai";
import { createDriver, quitDriver } from "../helpers/driver.js";
import { takeScreenshot } from "../helpers/utils.js";
import LoginPage from "../page-objects/LoginPage.js";
import { config } from "../config/test.config.js";

describe("Authentication - Login & Logout", function () {
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

  it("should load login page successfully", async function () {
    await loginPage.open();
    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).to.include("/login");
    await takeScreenshot(driver, "login-page-loaded");
  });

  it("should login with valid admin credentials", async function () {
    await loginPage.loginAsAdmin();
    await driver.sleep(2000);

    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).to.include("/dashboard");
    await takeScreenshot(driver, "login-success");
  });

  it("should redirect to dashboard after login", async function () {
    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).to.include("/dashboard");
  });
});
