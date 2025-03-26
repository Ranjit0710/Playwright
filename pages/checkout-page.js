"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckoutPage = void 0;
const test_1 = require("@playwright/test");
const base_page_1 = require("./base-page");
/**
 * CheckoutPage represents the checkout flow pages
 * Includes both information and overview pages
 */
class CheckoutPage extends base_page_1.BasePage {
    // Checkout information page elements
    firstNameInput;
    lastNameInput;
    postalCodeInput;
    continueButton;
    cancelButton;
    errorMessage;
    // Checkout overview page elements
    checkoutItems;
    itemTotalLabel;
    taxLabel;
    totalLabel;
    finishButton;
    cancelOverviewButton;
    // Checkout complete page elements
    completeHeader;
    completeText;
    backHomeButton;
    checkmarkImage;
    // Common elements
    pageTitle;
    /**
     * @param page Playwright page instance
     */
    constructor(page) {
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
    async gotoInformation() {
        await this.navigate("/checkout-step-one.html");
        await this.waitForPageLoad();
        await (0, test_1.expect)(this.pageTitle).toHaveText("Checkout: Your Information");
    }
    /**
     * Fill checkout information form
     * @param firstName First name
     * @param lastName Last name
     * @param postalCode Postal code
     */
    async fillInformation(firstName, lastName, postalCode) {
        await this.firstNameInput.fill(firstName);
        await this.lastNameInput.fill(lastName);
        await this.postalCodeInput.fill(postalCode);
    }
    /**
     * Continue to checkout overview
     */
    async continueToOverview() {
        await this.continueButton.click();
        await this.waitForPageLoad();
        await (0, test_1.expect)(this.pageTitle).toHaveText("Checkout: Overview");
    }
    /**
     * Fill information and continue to overview
     * @param firstName First name
     * @param lastName Last name
     * @param postalCode Postal code
     */
    async fillInformationAndContinue(firstName, lastName, postalCode) {
        await this.fillInformation(firstName, lastName, postalCode);
        await this.continueToOverview();
    }
    /**
     * Cancel checkout information and return to cart
     */
    async cancelInformation() {
        await this.cancelButton.click();
    }
    /**
     * Get error message from information page
     * @returns Error message text
     */
    async getErrorMessage() {
        await (0, test_1.expect)(this.errorMessage).toBeVisible();
        return await this.getText(this.errorMessage);
    }
    /**
     * Navigate to checkout overview page
     * Note: This is primarily for testing, normally you'd go through the information page
     */
    async gotoOverview() {
        await this.navigate("/checkout-step-two.html");
        await this.waitForPageLoad();
        await (0, test_1.expect)(this.pageTitle).toHaveText("Checkout: Overview");
    }
    /**
     * Get number of items in checkout
     * @returns Number of items
     */
    async getCheckoutItemCount() {
        return await this.checkoutItems.count();
    }
    /**
     * Get subtotal amount
     * @returns Subtotal amount as string (with $ sign)
     */
    async getSubtotal() {
        const text = await this.getText(this.itemTotalLabel);
        return text.split(": ")[1].trim();
    }
    /**
     * Get tax amount
     * @returns Tax amount as string (with $ sign)
     */
    async getTax() {
        const text = await this.getText(this.taxLabel);
        return text.split(": ")[1].trim();
    }
    /**
     * Get total amount
     * @returns Total amount as string (with $ sign)
     */
    async getTotal() {
        const text = await this.getText(this.totalLabel);
        return text.split(": ")[1].trim();
    }
    /**
     * Get numeric subtotal
     * @returns Subtotal as number
     */
    async getNumericSubtotal() {
        const subtotal = await this.getSubtotal();
        return parseFloat(subtotal.replace("$", ""));
    }
    /**
     * Get numeric tax
     * @returns Tax as number
     */
    async getNumericTax() {
        const tax = await this.getTax();
        return parseFloat(tax.replace("$", ""));
    }
    /**
     * Get numeric total
     * @returns Total as number
     */
    async getNumericTotal() {
        const total = await this.getTotal();
        return parseFloat(total.replace("$", ""));
    }
    /**
     * Verify total calculation is correct
     * @returns Boolean indicating if total is correctly calculated
     */
    async verifyTotalCalculation() {
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
    async finishPurchase() {
        await this.finishButton.click();
        await this.waitForPageLoad();
        await (0, test_1.expect)(this.pageTitle).toHaveText("Checkout: Complete!");
    }
    /**
     * Cancel checkout overview and return to products
     */
    async cancelOverview() {
        await this.cancelOverviewButton.click();
    }
    /**
     * Verify checkout complete page is displayed
     * @returns Boolean indicating if completion page is displayed
     */
    async isCheckoutComplete() {
        return ((await this.completeHeader.isVisible()) &&
            (await this.backHomeButton.isVisible()));
    }
    /**
     * Get checkout complete header text
     * @returns Complete header text
     */
    async getCompleteHeaderText() {
        return await this.getText(this.completeHeader);
    }
    /**
     * Get checkout complete message text
     * @returns Complete message text
     */
    async getCompleteMessageText() {
        return await this.getText(this.completeText);
    }
    /**
     * Return to products page from checkout complete
     */
    async returnToProducts() {
        await this.backHomeButton.click();
    }
    /**
     * Complete full checkout process
     * @param firstName First name
     * @param lastName Last name
     * @param postalCode Postal code
     * @returns Boolean indicating if checkout was successful
     */
    async completeCheckout(firstName, lastName, postalCode) {
        // Fill information and continue
        await this.fillInformationAndContinue(firstName, lastName, postalCode);
        // Complete purchase
        await this.finishPurchase();
        // Verify checkout complete
        return await this.isCheckoutComplete();
    }
}
exports.CheckoutPage = CheckoutPage;
