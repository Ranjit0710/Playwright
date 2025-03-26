"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasePage = void 0;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const pixelmatch_1 = __importDefault(require("pixelmatch"));
const pngjs_1 = require("pngjs");
/**
 * BasePage serves as the foundation for all page objects
 * Contains common methods and utilities for page interactions
 */
class BasePage {
    //Defines a class that will be the parent for all page objects
    page; //The readonly page property stores the Playwright page instance
    //readonly ensures the page won't be reassigned after initialization
    // Common selectors that might be present across pages
    //   Defines common UI elements that might appear across multiple pages
    // These are Playwright Locator objects that reference elements on the page
    header;
    footer;
    navigationMenu;
    loadingIndicator;
    /**
     * @param page Playwright page instance
     */
    constructor(page) {
        //Constructor initializes the page object with a Playwright page
        this.page = page; // Assigns the page to an instance variable
        // Initialize common elements
        this.header = page.locator(".primary-header");
        this.footer = page.locator(".footer");
        this.navigationMenu = page.locator("nav.menu");
        this.loadingIndicator = page.locator(".loading-indicator");
    }
    /**
     * Navigate to a specific URL path
     * @param path URL path to navigate to
     */
    //Method to navigate to a specific URL path
    async navigate(urlPath) {
        const baseUrl = "https://www.saucedemo.com";
        await this.page.goto(`${baseUrl}${urlPath}`); //Uses page.goto() to navigate to the URL and Returns a Promise that resolves when navigation completes
    }
    /**
     * Wait for page to be fully loaded
     */
    async waitForPageLoad() {
        //Waits for the page to be fully loaded
        // Wait for network to be idle
        await this.page.waitForLoadState("networkidle"); // First waits for network requests to finish
        // If there's a loading indicator, wait for it to disappear
        if (await this.loadingIndicator.isVisible())
            await this.loadingIndicator.waitFor({ state: "hidden", timeout: 30000 });
    }
    /**
     * Click an element and wait for navigation
     * @param locator Element to click
     */
    //   Navigation with Click
    //Clicks an element and waits for navigation to complete
    async clickAndWaitForNavigation(locator) {
        //Uses Promise.all to wait for both actions concurrently . This handles cases where clicking causes a page navigation
        await Promise.all([this.page.waitForNavigation(), locator.click()]);
    }
    /**
     * Get text content from an element
     * @param locator Element to get text from
     * @returns Text content
     */
    //   Text Retrieval Method
    //   Gets text content from an element
    // Returns empty string if no text content is found
    async getText(locator) {
        return (await locator.textContent()) || "";
    }
    /**
     * Check if element exists on the page
     * @param locator Element to check
     * @returns Boolean indicating if element exists
     */
    //   Element Presence Check
    //   Checks if an element exists on the page
    //   Returns true if element count is greater than 0
    async isElementPresent(locator) {
        //
        return (await locator.count()) > 0;
    }
    /**
     * Wait for element to be visible with custom timeout
     * @param locator Element to wait for
     * @param timeout Custom timeout in milliseconds
     */
    async waitForElementVisible(
    //Waits for an element to become visible
    locator, timeout //Accepts an optional timeout parameter
    ) {
        await locator.waitFor({ state: "visible", timeout: timeout }); //Throws an error if the element doesn't become visible within the timeout
    }
    /**
     * Perform visual comparison of an element with baseline image
     * @param locator Element to compare
     * @param baselineImageName Name of baseline image file
     * @param threshold Threshold for comparison (0-1)
     * @returns Difference percentage
     */
    async visualCompare(locator, baselineImageName, threshold = 0.1) {
        // Take screenshot of the element
        const screenshot = await locator.screenshot();
        // Load baseline image
        const baselinePath = path_1.default.join(__dirname, "../visual-baselines", baselineImageName);
        const baselineBuffer = (0, fs_1.readFileSync)(baselinePath);
        // Convert to PNG
        const actual = pngjs_1.PNG.sync.read(screenshot);
        const baseline = pngjs_1.PNG.sync.read(baselineBuffer);
        // Create diff PNG
        const { width, height } = actual;
        const diff = new pngjs_1.PNG({ width, height });
        // Compare images
        const numDiffPixels = (0, pixelmatch_1.default)(actual.data, baseline.data, diff.data, width, height, { threshold });
        // Calculate difference percentage
        const diffPercentage = (numDiffPixels / (width * height)) * 100;
        return diffPercentage;
    }
    /**
     * Intercept and mock network requests
     * @param url URL pattern to intercept
     * @param responseData Mock response data
     */
    //Network Mocking Method
    async mockNetworkResponse(
    //Intercepts network requests matching a URL pattern
    url, responseData) {
        await this.page.route(url, (route) => {
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify(responseData),
            });
        });
    }
    /**
     * Get performance metrics for the page
     * @returns Object containing performance metrics
     */
    async getPerformanceMetrics() {
        const metrics = await this.page.evaluate(() => {
            const perfEntries = performance.getEntriesByType("navigation");
            if (perfEntries.length > 0) {
                const navigationEntry = perfEntries[0];
                return {
                    domContentLoaded: navigationEntry.domContentLoadedEventEnd -
                        navigationEntry.startTime,
                    load: navigationEntry.loadEventEnd - navigationEntry.startTime,
                    firstContentfulPaint: performance.getEntriesByName("first-contentful-paint")[0]?.startTime,
                    networkRequests: performance.getEntriesByType("resource").length,
                };
            }
            return null;
        });
        return metrics;
    }
    /**
     * Check page for accessibility issues
     * @returns Array of accessibility violations
     */
    async checkAccessibility() {
        // Inject axe-core library if not already present
        await this.page.evaluate(() => {
            if (!window.hasOwnProperty("axe")) {
                const script = document.createElement("script");
                script.src =
                    "https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.7.0/axe.min.js";
                document.head.appendChild(script);
            }
        });
        // Wait for axe to be available
        await this.page.waitForFunction(() => window.hasOwnProperty("axe"));
        // Run accessibility audit
        const violations = await this.page.evaluate(() => {
            return new Promise((resolve) => {
                // @ts-ignore
                window.axe.run(document, { reporter: "v2" }, (err, results) => {
                    if (err)
                        resolve([]);
                    resolve(results.violations);
                });
            });
        });
        return violations;
    }
    /**
     * Take screenshot of the current page
     * @param name Screenshot name
     */
    async takeScreenshot(name) {
        await this.page.screenshot({
            path: `./screenshots/${name}.png`,
            fullPage: true,
        });
    }
    /**
     * Execute custom JavaScript on the page
     * @param script JavaScript to execute
     * @returns Result of the script execution
     */
    async executeScript(script) {
        return (await this.page.evaluate(script));
    }
    /**
     * Get all cookies for the current page
     * @returns Array of cookies
     */
    async getCookies() {
        return await this.page.context().cookies();
    }
    /**
     * Set cookie for the current page
     * @param name Cookie name
     * @param value Cookie value
     */
    async setCookie(name, value) {
        await this.page.context().addCookies([
            {
                name,
                value,
                url: this.page.url(),
            },
        ]);
    }
    /**
     * Clear all cookies for the current page
     */
    async clearCookies() {
        await this.page.context().clearCookies();
    }
    /**
     * Scroll to specific element
     * @param locator Element to scroll to
     */
    async scrollToElement(locator) {
        await locator.scrollIntoViewIfNeeded();
    }
    /**
     * Scroll to bottom of page
     */
    async scrollToBottom() {
        await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    }
    /**
     * Get current URL
     * @returns Current URL
     */
    async getCurrentUrl() {
        return this.page.url();
    }
    /**
     * Get page title
     * @returns Page title
     */
    async getPageTitle() {
        return await this.page.title();
    }
    /**
     * Retry an action with exponential backoff
     * @param action Function to retry
     * @param maxRetries Maximum number of retries
     * @param initialDelay Initial delay in milliseconds
     * @returns Result of the action
     */
    async retryWithBackoff(action, maxRetries = 3, initialDelay = 1000) {
        let lastError;
        let delay = initialDelay;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await action();
            }
            catch (error) {
                lastError = error;
                console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
                await new Promise((resolve) => setTimeout(resolve, delay));
                delay *= 2; // Exponential backoff
            }
        }
        throw lastError;
    }
}
exports.BasePage = BasePage;
