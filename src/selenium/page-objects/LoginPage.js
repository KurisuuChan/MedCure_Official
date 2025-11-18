import { By, until } from "selenium-webdriver";
import { config } from "../config/test.config.js";

export default class LoginPage {
  constructor(driver) {
    this.driver = driver;
    this.url = `${config.baseUrl}/login`;

    this.locators = {
      emailInput: By.css('input[type="email"], input[name="email"]'),
      passwordInput: By.css('input[type="password"], input[name="password"]'),
      loginButton: By.xpath(
        '//button[contains(., "Login") or contains(., "Sign In")]'
      ),
    };
  }

  async open() {
    await this.driver.get(this.url);
    await this.driver.sleep(1000);
  }

  async login(email, password) {
    await this.driver.findElement(this.locators.emailInput).sendKeys(email);
    await this.driver
      .findElement(this.locators.passwordInput)
      .sendKeys(password);
    await this.driver.findElement(this.locators.loginButton).click();
    await this.driver.sleep(2000);
  }

  async loginAsAdmin() {
    await this.open();
    await this.login(
      config.testUsers.admin.email,
      config.testUsers.admin.password
    );
  }
}
