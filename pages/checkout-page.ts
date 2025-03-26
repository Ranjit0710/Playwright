import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./base-page";

/**
 * CheckoutPage represents the checkout flow pages
 * Includes both information and overview pages
 */
export class CheckoutPage extends BasePage {
  // Checkout information page elements
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly postalCodeInput: Locator;
  readonly continueButton: Locator;
  readonly cancelButton: Locator;
  readonly errorMessage: Locator;

  // Checkout overview page elements
  readonly checkoutItems: Locator;
  readonly itemTotalLabel: Locator;
  readonly taxLabel: Locator;
  readonly totalLabel: Locator;
  readonly finishButton: Locator;
  readonly cancelOverviewButton: Locator;

  // Checkout complete page elements
  readonly completeHeader: Locator;
  readonly completeText: Locator;
  readonly backHomeButton: Locator;
  readonly checkmarkImage: Locator;

  // Common elements
  readonly pageTitle: Locator;

  /**
   * @param page Playwright page instance
   */
  constructor(page: Page) {
    super(page);

    // Checkout information page elements
    this.firstNameInput = page.locator('[data-test="firstName"]');
    this.lastNameInput = page.locator('[data-test="lastName"]');
    this.postalCodeInput = page.locator('[data-test="postalCode"]');
    this.continueButton = page.locator('[data-test="continue"]');
    this.cancelButton = page.locator('[data-test="cancel"]');
    this.errorMessage = page.locator('[data-test="error"]');

    // Checkout overview page elements
    this.checkoutItems = page.locator(".cart_item");
    this.itemTotalLabel = page.locator(".summary_subtotal_label");
    this.taxLabel = page.locator(".summary_tax_label");
    this.totalLabel = page.locator(".summary_total_label");
    this.finishButton = page.locator('[data-test="finish"]');
    this.cancelOverviewButton = page.locator('[data-test="cancel"]');

    // Checkout complete page elements
    this.completeHeader = page.locator(".complete-header");
    this.completeText = page.locator(".complete-text");
    this.backHomeButton = page.locator('[data-test="back-to-products"]');
    this.checkmarkImage = page.locator(".pony_express");

    // Common elements
    this.pageTitle = page.locator(".title");
  }

  /**
   * Navigate to checkout information page
   */
  async gotoInformation(): Promise<void> {
    await this.navigate("/checkout-step-one.html");
    await this.waitForPageLoad();
    await expect(this.pageTitle).toHaveText("Checkout: Your Information");
  }

  /**
   * Fill checkout information form
   * @param firstName First name
   * @param lastName Last name
   * @param postalCode Postal code
   */
  async fillInformation(
    firstName: string,
    lastName: string,
    postalCode: string
  ): Promise<void> {
    await this.firstNameInput.fill(firstName);
    await this.lastNameInput.fill(lastName);
    await this.postalCodeInput.fill(postalCode);
  }

  /**
   * Continue to checkout overview
   */
  async continueToOverview(): Promise<void> {
    await this.continueButton.click();
    await this.waitForPageLoad();
    await expect(this.pageTitle).toHaveText("Checkout: Overview");
  }

  /**
   * Fill information and continue to overview
   * @param firstName First name
   * @param lastName Last name
   * @param postalCode Postal code
   */
  async fillInformationAndContinue(
    firstName: string,
    lastName: string,
    postalCode: string
  ): Promise<void> {
    await this.fillInformation(firstName, lastName, postalCode);
    await this.continueToOverview();
  }

  /**
   * Cancel checkout information and return to cart
   */
  async cancelInformation(): Promise<void> {
    await this.cancelButton.click();
  }

  /**
   * Get error message from information page
   * @returns Error message text
   */
  async getErrorMessage(): Promise<string> {
    await expect(this.errorMessage).toBeVisible();
    return await this.getText(this.errorMessage);
  }

  /**
   * Navigate to checkout overview page
   * Note: This is primarily for testing, normally you'd go through the information page
   */
  async gotoOverview(): Promise<void> {
    await this.navigate("/checkout-step-two.html");
    await this.waitForPageLoad();
    await expect(this.pageTitle).toHaveText("Checkout: Overview");
  }

  /**
   * Get number of items in checkout
   * @returns Number of items
   */
  async getCheckoutItemCount(): Promise<number> {
    return await this.checkoutItems.count();
  }

  /**
   * Get subtotal amount
   * @returns Subtotal amount as string (with $ sign)
   */
  async getSubtotal(): Promise<string> {
    const text = await this.getText(this.itemTotalLabel);
    return text.split(": ")[1].trim();
  }

  /**
   * Get tax amount
   * @returns Tax amount as string (with $ sign)
   */
  async getTax(): Promise<string> {
    const text = await this.getText(this.taxLabel);
    return text.split(": ")[1].trim();
  }

  /**
   * Get total amount
   * @returns Total amount as string (with $ sign)
   */
  async getTotal(): Promise<string> {
    const text = await this.getText(this.totalLabel);
    return text.split(": ")[1].trim();
  }

  /**
   * Get numeric subtotal
   * @returns Subtotal as number
   */
  async getNumericSubtotal(): Promise<number> {
    const subtotal = await this.getSubtotal();
    return parseFloat(subtotal.replace("$", ""));
  }

  /**
   * Get numeric tax
   * @returns Tax as number
   */
  async getNumericTax(): Promise<number> {
    const tax = await this.getTax();
    return parseFloat(tax.replace("$", ""));
  }

  /**
   * Get numeric total
   * @returns Total as number
   */
  async getNumericTotal(): Promise<number> {
    const total = await this.getTotal();
    return parseFloat(total.replace("$", ""));
  }

  /**
   * Verify total calculation is correct
   * @returns Boolean indicating if total is correctly calculated
   */
  async verifyTotalCalculation(): Promise<boolean> {
    const subtotal = await this.getNumericSubtotal();
    const tax = await this.getNumericTax();
    const total = await this.getNumericTotal();

    // Calculate expected total (rounded to 2 decimal places)
    const expectedTotal = parseFloat((subtotal + tax).toFixed(2));

    // Allow for small floating point differences
    return Math.abs(total - expectedTotal) < 0.01;
  }

  /**
   * Complete purchase by clicking finish button
   */
  async finishPurchase(): Promise<void> {
    await this.finishButton.click();
    await this.waitForPageLoad();
    await expect(this.pageTitle).toHaveText("Checkout: Complete!");
  }

  /**
   * Cancel checkout overview and return to products
   */
  async cancelOverview(): Promise<void> {
    await this.cancelOverviewButton.click();
  }

  /**
   * Verify checkout complete page is displayed
   * @returns Boolean indicating if completion page is displayed
   */
  async isCheckoutComplete(): Promise<boolean> {
    return (
      (await this.completeHeader.isVisible()) &&
      (await this.backHomeButton.isVisible())
    );
  }

  /**
   * Get checkout complete header text
   * @returns Complete header text
   */
  async getCompleteHeaderText(): Promise<string> {
    return await this.getText(this.completeHeader);
  }

  /**
   * Get checkout complete message text
   * @returns Complete message text
   */
  async getCompleteMessageText(): Promise<string> {
    return await this.getText(this.completeText);
  }

  /**
   * Return to products page from checkout complete
   */
  async returnToProducts(): Promise<void> {
    await this.backHomeButton.click();
  }

  /**
   * Complete full checkout process
   * @param firstName First name
   * @param lastName Last name
   * @param postalCode Postal code
   * @returns Boolean indicating if checkout was successful
   */
  async completeCheckout(
    firstName: string,
    lastName: string,
    postalCode: string
  ): Promise<boolean> {
    // Fill information and continue
    await this.fillInformationAndContinue(firstName, lastName, postalCode);

    // Complete purchase
    await this.finishPurchase();

    // Verify checkout complete
    return await this.isCheckoutComplete();
  }
}
