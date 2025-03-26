"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.expect = exports.test = void 0;
const test_1 = require("@playwright/test");
const login_page_1 = require("../../pages/login-page");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
// Load test users data
const testUsers = JSON.parse((0, fs_1.readFileSync)(path_1.default.join(__dirname, "../data/test-users.json"), "utf-8"));
/**
 * Authentication fixture that extends the base test fixture
 * Provides authenticated page, context, and request objects
 */
exports.test = test_1.test.extend({
    // Default user role is 'standard'
    userRole: ["standard", { option: true }],
    // Create an authenticated browser context that can be used across tests
    authenticatedContext: async ({ browser, userRole }, use) => {
        // Create a new browser context
        const context = await browser.newContext();
        // Create a new page
        const page = await context.newPage();
        // Find user by role
        const user = testUsers.find((user) => user.type === userRole);
        if (!user) {
            throw new Error(`User with role '${userRole}' not found in test-users.json`);
        }
        // Login via UI
        const loginPage = new login_page_1.LoginPage(page);
        await loginPage.goto();
        await loginPage.login(user.username, user.password);
        // Wait for login to complete and verify
        if (userRole !== "locked_out") {
            // For non-locked users, we should be redirected
            await page.waitForURL("**/inventory.html");
        }
        // Store authentication state (cookies, localStorage)
        await context.storageState({ path: `./auth-state-${userRole}.json` });
        // Use the authenticated context in the test
        await use(context);
        // Close the context after test is complete
        await context.close();
    },
    // Create a page from the authenticated context
    authenticatedPage: async ({ authenticatedContext }, use) => {
        // Create a new page in the authenticated context
        const page = await authenticatedContext.newPage();
        // Use the authenticated page in the test
        await use(page);
    },
    // Create a request context that carries authentication cookies
    authenticatedRequest: async ({ playwright, userRole }, use) => {
        // Find user by role
        const user = testUsers.find((user) => user.type === userRole);
        if (!user) {
            throw new Error(`User with role '${userRole}' not found in test-users.json`);
        }
        // Create a new request context
        let apiContext = await playwright.request.newContext({
            baseURL: process.env.BASE_URL || "https://www.saucedemo.com",
            extraHTTPHeaders: {
                Accept: "application/json",
            },
        });
        // Login via API if available (this is pseudo-code, adjust for your API)
        // If API login is not available, you can use the storage state from UI login
        try {
            // Try to authenticate via API
            const loginResponse = await apiContext.post("/api/login", {
                data: {
                    username: user.username,
                    password: user.password,
                },
            });
            if (loginResponse.ok()) {
                const loginData = await loginResponse.json();
                // Add auth token to subsequent requests
                // Recreate the API context with updated headers
                await apiContext.dispose();
                apiContext = await playwright.request.newContext({
                    baseURL: process.env.BASE_URL || "https://www.saucedemo.com",
                    extraHTTPHeaders: {
                        Accept: "application/json",
                        Authorization: `Bearer ${loginData.token}`,
                    },
                });
            }
        }
        catch (error) {
            console.warn("API login not available, using storage state from UI login");
            // Use storage state from UI login if API login fails
            if (userRole !== "locked_out") {
                try {
                    const storageState = JSON.parse((0, fs_1.readFileSync)(`./auth-state-${userRole}.json`, "utf-8"));
                    // Apply storage state from the file
                    await apiContext.dispose();
                    apiContext = await playwright.request.newContext({
                        baseURL: process.env.BASE_URL || "https://www.saucedemo.com",
                        storageState: {
                            cookies: storageState.cookies,
                            origins: storageState.origins || [],
                        },
                    });
                }
                catch (e) {
                    console.error(`Storage state file for role '${userRole}' not found. Run UI login first.`);
                }
            }
        }
        // Use the authenticated request context in the test
        await use(Promise.resolve(apiContext));
        // Dispose the request context after test
        await apiContext.dispose();
    },
});
// Export the expect function from the base test
exports.expect = test_1.test.expect;
