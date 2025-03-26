import { test, expect } from "@playwright/test";
import { LoginPage } from "../../pages/login-page";
import { ProductListPage } from "../../pages/product-list-page";
import { CartPage } from "../../pages/cart-page";
import * as fs from "fs";
import * as path from "path";

// Load test users or use defaults
let testUsers;
try {
  const testDataPath = path.join(__dirname, "../../data/test-users.json");
  testUsers = JSON.parse(fs.readFileSync(testDataPath, "utf-8"));
} catch (error) {
  console.error("Error loading test users, using defaults:", error);
  testUsers = [
    {
      type: "standard",
      username: "standard_user",
      password: "secret_sauce",
      description: "Standard user with no restrictions",
    },
  ];
}

test.describe("Checkout Process", () => {
  // Before each test, login with standard user
  test.beforeEach(async ({ page, browserName }) => {
    // Log browser for debugging
    console.log(`Running test in ${browserName} browser`);

    // Go to the login page
    await page.goto("https://www.saucedemo.com/");

    // Wait for login page to load
    await page.waitForSelector('[data-test="username"]', {
      state: "visible",
      timeout: 15000,
    });

    // Get login credentials
    interface TestUser {
      type: string;
      username: string;
      password: string;
      description: string;
    }

    const standardUser: TestUser | undefined = testUsers.find(
      (user: TestUser) => user.type === "standard"
    );
    if (!standardUser) {
      throw new Error("Standard user not found in test data");
    }

    // Login directly without using page object
    await page.fill('[data-test="username"]', standardUser.username);
    await page.fill('[data-test="password"]', standardUser.password);
    await page.click('[data-test="login-button"]');

    // Verify we're on the inventory page
    await page.waitForURL(/.*inventory.html/, { timeout: 15000 });
    console.log("Successfully logged in");
  });

  test("Complete checkout process @regression", async ({
    page,
    browserName,
  }) => {
    // Set very long timeout for this test
    test.setTimeout(180000);

    // Mark steps as we progress to trace progress
    let currentStep = 0;

    try {
      // Step 1: Verify we're on the inventory page
      currentStep = 1;
      console.log(
        `[${browserName}] Step ${currentStep}: Verifying inventory page`
      );

      await page.waitForSelector(".inventory_item", { timeout: 15000 });
      const productCount = await page.locator(".inventory_item").count();
      console.log(`[${browserName}] Found ${productCount} products`);

      // Take screenshot for debugging
      await page.screenshot({ path: `inventory-${browserName}.png` });

      // Step 2: Add products to cart
      currentStep = 2;
      console.log(
        `[${browserName}] Step ${currentStep}: Adding products to cart`
      );

      // Ensure we have at least 2 products before trying to add them
      if (productCount < 2) {
        throw new Error(
          `Not enough products found (${productCount}), need at least 2`
        );
      }

      // Add first product
      const firstAddButton = page
        .locator('button[data-test^="add-to-cart"]')
        .first();
      await firstAddButton.waitFor({ state: "visible", timeout: 10000 });
      await firstAddButton.click();
      console.log(`[${browserName}] Added first product`);

      // Wait a moment between clicks
      await page.waitForTimeout(1000);

      // Add second product - get all buttons again as DOM might have changed
      const secondAddButton = page
        .locator('button[data-test^="add-to-cart"]')
        .first();
      await secondAddButton.waitFor({ state: "visible", timeout: 10000 });
      await secondAddButton.click();
      console.log(`[${browserName}] Added second product`);

      // Step 3: Go to cart
      currentStep = 3;
      console.log(`[${browserName}] Step ${currentStep}: Navigating to cart`);

      await page.waitForTimeout(1000); // Ensure cart is updated
      await page.locator(".shopping_cart_link").click();

      // Verify we're on the cart page
      await page.waitForURL(/.*cart.html/, { timeout: 15000 });
      console.log(`[${browserName}] Successfully navigated to cart page`);

      // Take screenshot for debugging
      await page.screenshot({ path: `cart-${browserName}.png` });

      // Step 4: Proceed to checkout
      currentStep = 4;
      console.log(
        `[${browserName}] Step ${currentStep}: Proceeding to checkout`
      );

      // Wait for checkout button and click it
      const checkoutButton = page.locator('[data-test="checkout"]');
      await checkoutButton.waitFor({ state: "visible", timeout: 10000 });
      await checkoutButton.click();

      // Verify we're on the checkout info page
      await page.waitForURL(/.*checkout-step-one.html/, { timeout: 15000 });
      console.log(
        `[${browserName}] Successfully navigated to checkout step one`
      );

      // Take screenshot for debugging
      await page.screenshot({ path: `checkout-step1-${browserName}.png` });

      // Step 5: Fill checkout information
      currentStep = 5;
      console.log(
        `[${browserName}] Step ${currentStep}: Filling checkout information`
      );

      // Wait for all fields to be visible and fill them
      await page.waitForSelector('[data-test="firstName"]', {
        state: "visible",
        timeout: 10000,
      });

      // Fill in form fields with short delays between
      await page.fill('[data-test="firstName"]', "Test");
      await page.waitForTimeout(300);
      await page.fill('[data-test="lastName"]', "User");
      await page.waitForTimeout(300);
      await page.fill('[data-test="postalCode"]', "12345");

      console.log(`[${browserName}] Filled checkout information`);

      // Step 6: Continue to checkout overview
      currentStep = 6;
      console.log(
        `[${browserName}] Step ${currentStep}: Continuing to checkout overview`
      );

      await page.waitForTimeout(1000); // Ensure form is fully populated
      await page.locator('[data-test="continue"]').click();

      // Verify we're on the checkout overview page
      await page.waitForURL(/.*checkout-step-two.html/, { timeout: 15000 });
      console.log(
        `[${browserName}] Successfully navigated to checkout step two`
      );

      // Take screenshot for debugging
      await page.screenshot({ path: `checkout-step2-${browserName}.png` });

      // Step 7: Complete purchase
      currentStep = 7;
      console.log(`[${browserName}] Step ${currentStep}: Completing purchase`);

      // Wait for finish button and click it
      const finishButton = page.locator('[data-test="finish"]');
      await finishButton.waitFor({ state: "visible", timeout: 10000 });
      await finishButton.click();

      // Verify we're on the checkout complete page
      await page.waitForURL(/.*checkout-complete.html/, { timeout: 15000 });
      console.log(
        `[${browserName}] Successfully navigated to checkout complete page`
      );

      // Take screenshot for debugging
      await page.screenshot({ path: `checkout-complete-${browserName}.png` });

      // Step 8: Verify thank you message
      currentStep = 8;
      console.log(
        `[${browserName}] Step ${currentStep}: Verifying thank you message`
      );

      // Wait for thank you header
      const thankYouHeader = page.locator(".complete-header");
      await thankYouHeader.waitFor({ state: "visible", timeout: 10000 });

      // Get header text and verify it
      const headerText = await thankYouHeader.textContent();
      console.log(`[${browserName}] Header text: "${headerText}"`);

      // Use case-insensitive match or actual text instead of uppercase
      expect(headerText?.toLowerCase()).toContain("thank you");

      // Step 9: Return to products
      currentStep = 9;
      console.log(
        `[${browserName}] Step ${currentStep}: Returning to products`
      );

      // Wait for back button and click it
      const backButton = page.locator('[data-test="back-to-products"]');
      await backButton.waitFor({ state: "visible", timeout: 10000 });
      await backButton.click();

      // Verify we're back on the inventory page
      await page.waitForURL(/.*inventory.html/, { timeout: 15000 });
      console.log(`[${browserName}] Successfully returned to products page`);
      console.log(`[${browserName}] Test completed successfully!`);
    } catch (error) {
      // Create failure screenshot with step number
      await page.screenshot({
        path: `failure-step${currentStep}-${browserName}.png`,
      });
      console.error(
        `[${browserName}] Test failed at step ${currentStep}: ${(error as Error).message}`
      );
      throw error;
    }
  });

  test("Validate checkout information form @smoke", async ({
    page,
    browserName,
  }) => {
    // Add product to cart
    console.log(`[${browserName}] Adding product to cart`);

    // Add first product
    const addButton = page.locator('button[data-test^="add-to-cart"]').first();
    await addButton.waitFor({ state: "visible", timeout: 10000 });
    await addButton.click();

    // Go to cart
    console.log(`[${browserName}] Going to cart`);
    await page.locator(".shopping_cart_link").click();
    await page.waitForURL(/.*cart.html/);

    // Proceed to checkout
    console.log(`[${browserName}] Proceeding to checkout`);
    await page.locator('[data-test="checkout"]').click();
    await page.waitForURL(/.*checkout-step-one.html/);

    // Test empty first name
    console.log(`[${browserName}] Testing empty first name`);
    await page.fill('[data-test="firstName"]', "");
    await page.fill('[data-test="lastName"]', "User");
    await page.fill('[data-test="postalCode"]', "12345");
    await page.locator('[data-test="continue"]').click();

    // Check error message
    const errorElement = page.locator('[data-test="error"]');
    await expect(errorElement).toBeVisible();
    expect(await errorElement.textContent()).toContain(
      "First Name is required"
    );

    // Test empty last name
    console.log(`[${browserName}] Testing empty last name`);
    await page.fill('[data-test="firstName"]', "Test");
    await page.fill('[data-test="lastName"]', "");
    await page.fill('[data-test="postalCode"]', "12345");
    await page.locator('[data-test="continue"]').click();

    await expect(errorElement).toBeVisible();
    expect(await errorElement.textContent()).toContain("Last Name is required");

    // Test empty postal code
    console.log(`[${browserName}] Testing empty postal code`);
    await page.fill('[data-test="firstName"]', "Test");
    await page.fill('[data-test="lastName"]', "User");
    await page.fill('[data-test="postalCode"]', "");
    await page.locator('[data-test="continue"]').click();

    await expect(errorElement).toBeVisible();
    expect(await errorElement.textContent()).toContain(
      "Postal Code is required"
    );

    // Test valid information
    console.log(`[${browserName}] Testing valid information`);
    await page.fill('[data-test="firstName"]', "Test");
    await page.fill('[data-test="lastName"]', "User");
    await page.fill('[data-test="postalCode"]', "12345");
    await page.locator('[data-test="continue"]').click();

    // Verify we proceed to the next step
    await page.waitForURL(/.*checkout-step-two.html/);
    console.log(`[${browserName}] Form validation test passed`);
  });
});
