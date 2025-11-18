import { By } from "selenium-webdriver";
import { config } from "../config/test.config.js";

export default class TransactionHistoryPage {
  constructor(driver) {
    this.driver = driver;
    this.url = `${config.baseUrl}/transaction-history`;
  }

  async open() {
    await this.driver.get(this.url);
    await this.driver.sleep(1500);
  }

  async hasTransactions() {
    try {
      const table = await this.driver.findElement(
        By.css("table, .transaction-list, [class*='transaction']")
      );
      return true;
    } catch {
      return false;
    }
  }
}
