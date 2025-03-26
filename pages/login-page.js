"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginPage = void 0;
const test_1 = require("@playwright/test");
const base_page_1 = require("./base-page");
/**
 * LoginPage represents the login page of the application
 * Contains methods for authentication-related actions
 */
class LoginPage extends base_page_1.BasePage {
    // Extends BasePage to inherit common functionality
    // Login form elements
    usernameInput;
    passwordInput;
    loginButton;
    errorMessage;
    logo;
    /**
     * @param page Playwright page instance
     */
    constructor(page) {
        super(page);
        // Initialize login page elements
        this.usernameInput = page.locator('[data-test="username"]');
        this.passwordInput = page.locator('[data-test="password"]');
        this.loginButton = page.locator('[data-test="login-button"]');
        this.errorMessage = page.locator('[data-test="error"]');
        this.logo = page.locator(".login_logo");
    }
    /**
     * Navigate to login page
     */
    async goto() {
        await this.navigate("/");
        await this.waitForPageLoad();
        // Verify we're on the login page
        await (0, test_1.expect)(this.loginButton).toBeVisible();
    }
    /**
     * Login with username and password
     * @param username Username for login
     * @param password Password for login
     */
    // LOGIN METHOD
    async login(username, password) {
        await this.usernameInput.fill(username);
        await this.passwordInput.fill(password);
        // Use Promise.all to wait for navigation and click simultaneously
        if (username && password && username !== "locked_out_user") {
            // For valid credentials, we expect navigation to occur
            try {
                await Promise.all([
                    this.page.waitForNavigation({ timeout: 10000 }), // Increase timeout to 10 seconds
                    this.loginButton.click(),
                ]);
            }
            catch (error) {
                console.log("Navigation may not have completed, continuing with test...");
                await this.loginButton.click();
            }
        }
        else {
            // For invalid credentials, we don't expect navigation
            await this.loginButton.click();
        }
    }
    /**
     * Get error message text when login fails
     * @returns Error message text
     */
    async getErrorMessage() {
        await (0, test_1.expect)(this.errorMessage).toBeVisible({ timeout: 5000 });
        return this.getText(this.errorMessage);
    }
    /**
     * Check if error message is displayed
     * @returns Boolean indicating if error message is present
     */
    async isErrorDisplayed() {
        return await this.errorMessage.isVisible();
    }
    /**
     * Perform successful login and verify redirect
     * @param username Valid username
     * @param password Valid password
     * @param expectedRedirectUrl Expected URL after login
     */
    async loginAndVerifyRedirect(username, password, expectedRedirectUrl = "/inventory.html") {
        await this.login(username, password);
        // Wait for redirect and verify URL
        await this.page.waitForURL(`**${expectedRedirectUrl}`, { timeout: 10000 });
        const currentUrl = await this.getCurrentUrl();
        (0, test_1.expect)(currentUrl).toContain(expectedRedirectUrl);
    }
    /**
     * Test login with invalid credentials and verify error
     * @param username Invalid username
     * @param password Invalid password
     * @param expectedErrorText Expected error message
     */
    async verifyLoginFailure(username, password, expectedErrorText) {
        await this.login(username, password);
        // Check error is displayed
        await (0, test_1.expect)(this.errorMessage).toBeVisible();
        // If expected error text provided, verify it
        if (expectedErrorText) {
            const actualError = await this.getErrorMessage();
            (0, test_1.expect)(actualError).toContain(expectedErrorText);
        }
    }
    /**
     * Clear login form
     */
    async clearLoginForm() {
        await this.usernameInput.clear();
        await this.passwordInput.clear();
    }
    /**
     * Check if login page is loaded
     * @returns Boolean indicating if login page is loaded
     */
    async isLoginPageLoaded() {
        return ((await this.loginButton.isVisible()) &&
            (await this.usernameInput.isVisible()) &&
            (await this.passwordInput.isVisible()));
    }
    /**
     * Verify login form elements are visible
     */
    async verifyLoginFormElements() {
        await (0, test_1.expect)(this.usernameInput).toBeVisible();
        await (0, test_1.expect)(this.passwordInput).toBeVisible();
        await (0, test_1.expect)(this.loginButton).toBeVisible();
        await (0, test_1.expect)(this.logo).toBeVisible();
    }
}
exports.LoginPage = LoginPage;
