import { By } from "selenium-webdriver";
import { config } from "../config/test.config.js";

export default class InventoryPage {
  constructor(driver) {
    this.driver = driver;
    this.url = `${config.baseUrl}/inventory`;

    this.locators = {
      addProductButton: By.xpath(
        '//button[contains(., "Add") and contains(., "Product")]'
      ),
      searchInput: By.css('input[type="search"], input[placeholder*="Search"]'),
      productNameInput: By.css(
        'input[name="name"], input[placeholder*="Product Name"]'
      ),
      saveButton: By.xpath('//button[contains(., "Save")]'),
    };
  }

  async open() {
    await this.driver.get(this.url);
    await this.driver.sleep(1500);
  }

  async clickAddProduct() {
    const addBtn = await this.driver.findElement(
      this.locators.addProductButton
    );
    await addBtn.click();
    await this.driver.sleep(1000);
  }

  async searchProduct(searchTerm) {
    const searchInput = await this.driver.findElement(
      this.locators.searchInput
    );
    await searchInput.clear();
    await searchInput.sendKeys(searchTerm);
    await this.driver.sleep(1000);
  }
}
