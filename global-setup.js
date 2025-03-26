"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const login_page_1 = require("./pages/login-page");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
/**
 * Global setup function that runs before all tests
 * Used for creating authenticated states and initial test data
 */
async function globalSetup(config) {
    console.log("🚀 Running global setup...");
    // Read test users
    const usersPath = path.join(__dirname, "data", "test-users.json");
    if (!fs.existsSync(usersPath)) {
        console.warn("⚠️ Test users file not found. Skipping authentication setup.");
        return;
    }
    const users = JSON.parse(fs.readFileSync(usersPath, "utf-8"));
    // Create storage states for different user types
    const browser = await test_1.chromium.launch();
    for (const user of users) {
        if (user.type === "locked_out") {
            // Skip locked out users as they can't log in
            continue;
        }
        console.log(`Creating auth state for ${user.type} user...`);
        // Create a new browser context
        const context = await browser.newContext();
        const page = await context.newPage();
        try {
            // Go to login page
            const loginPage = new login_page_1.LoginPage(page);
            await loginPage.goto();
            // Login
            await loginPage.login(user.username, user.password);
            // Wait for login to complete and verify
            await page.waitForURL("**/inventory.html");
            // Save storage state to file
            await context.storageState({
                path: path.join(__dirname, `auth-state-${user.type}.json`),
            });
            console.log(`✅ Auth state created for ${user.type} user`);
        }
        catch (error) {
            console.error(`❌ Failed to create auth state for ${user.type} user:`, error);
        }
        finally {
            await context.close();
        }
    }
    await browser.close();
    console.log("✅ Global setup completed");
}
exports.default = globalSetup;
