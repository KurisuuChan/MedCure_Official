import { By } from "selenium-webdriver";
import { config } from "../config/test.config.js";

export default class DashboardPage {
  constructor(driver) {
    this.driver = driver;
    this.url = `${config.baseUrl}/dashboard`;
  }

  async open() {
    await this.driver.get(this.url);
    await this.driver.sleep(1500);
  }

  async isLoaded() {
    const currentUrl = await this.driver.getCurrentUrl();
    return currentUrl.includes("/dashboard");
  }
}
