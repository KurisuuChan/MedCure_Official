import { By } from "selenium-webdriver";
import { config } from "../config/test.config.js";

export default class CustomersPage {
  constructor(driver) {
    this.driver = driver;
    this.url = `${config.baseUrl}/customers`;

    this.locators = {
      addCustomerButton: By.xpath(
        '//button[contains(., "Add") and contains(., "Customer")]'
      ),
      customerNameInput: By.css(
        'input[name="name"], input[placeholder*="Name"]'
      ),
      saveButton: By.xpath('//button[contains(., "Save")]'),
    };
  }

  async open() {
    await this.driver.get(this.url);
    await this.driver.sleep(1500);
  }

  async clickAddCustomer() {
    const addBtn = await this.driver.findElement(
      this.locators.addCustomerButton
    );
    await addBtn.click();
    await this.driver.sleep(1000);
  }
}
