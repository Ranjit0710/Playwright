import { chromium, FullConfig } from "@playwright/test";
import { LoginPage } from "./pages/login-page";
import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Global setup function that runs before all tests
 * Used for creating authenticated states and initial test data
 */
async function globalSetup(config: FullConfig) {
  console.log("🚀 Running global setup...");

  // Read test users
  const usersPath = path.join(__dirname, "data", "test-users.json");
  if (!fs.existsSync(usersPath)) {
    console.warn(
      "⚠️ Test users file not found. Skipping authentication setup."
    );
    return;
  }

  const users = JSON.parse(fs.readFileSync(usersPath, "utf-8"));

  // Create storage states for different user types
  const browser = await chromium.launch();

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
      const loginPage = new LoginPage(page);
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
    } catch (error) {
      console.error(
        `❌ Failed to create auth state for ${user.type} user:`,
        error
      );
    } finally {
      await context.close();
    }
  }

  await browser.close();
  console.log("✅ Global setup completed");
}

export default globalSetup;
