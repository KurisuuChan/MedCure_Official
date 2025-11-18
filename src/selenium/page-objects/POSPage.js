import { By } from "selenium-webdriver";
import { config } from "../config/test.config.js";

export default class POSPage {
  constructor(driver) {
    this.driver = driver;
    this.url = `${config.baseUrl}/pos`;

    this.locators = {
      searchInput: By.css(
        'input[type="search"], input[placeholder*="Search"], input[placeholder*="Product"]'
      ),
      completeSaleButton: By.xpath(
        '//button[contains(., "Complete") or contains(., "Checkout") or contains(., "Pay")]'
      ),
    };
  }

  async open() {
    await this.driver.get(this.url);
    await this.driver.sleep(2000);
  }

  async searchProduct(productName) {
    const searchInput = await this.driver.findElement(
      this.locators.searchInput
    );
    await searchInput.clear();
    await searchInput.sendKeys(productName);
    await this.driver.sleep(1500);
  }
}
