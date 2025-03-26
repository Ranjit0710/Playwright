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
  // Provide fallback test users
  testUsers = [
    {
      type: "standard",
      username: "standard_user",
      password: "secret_sauce",
      description: "Standard user with no restrictions",
    },
  ];
}

//Test Group and Setup

test.describe("Cart Operations", () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    const loginPage = new LoginPage(page);
    await loginPage.goto();

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

    await loginPage.login(standardUser.username, standardUser.password);

    // Verify we're on the inventory page
    await expect(page).toHaveURL(/.*inventory.html/, { timeout: 15000 });
  });

  //Test Case Definition

  test("Add items to cart as standard user @smoke", async ({ page }) => {
    // Increase timeout for more stability
    test.setTimeout(60000);

    // Create page objects
    const productListPage = new ProductListPage(page);
    const cartPage = new CartPage(page);

    // Wait for product page to be fully loaded
    await expect(productListPage.productTitle).toBeVisible({ timeout: 10000 });

    // Initial State Check

    // Get initial cart count (if any)
    let initialCartCount = 0;
    try {
      if (await productListPage.cartBadge.isVisible({ timeout: 1000 })) {
        const badgeText =
          (await productListPage.cartBadge.textContent()) || "0";
        initialCartCount = parseInt(badgeText, 10);
      }
    } catch (error) {
      // If badge isn't visible, count is 0
      console.log("No items initially in cart");
    }

    console.log(`Initial cart count: ${initialCartCount}`);

    // Product Count Verification
    // Log product count for debugging
    const productCount = await productListPage.getProductCount();
    console.log(`Found ${productCount} products on page`);

    // Make sure we have at least 2 products
    expect(productCount).toBeGreaterThanOrEqual(2);

    // Add first product to cart with retry logic
    await productListPage.addProductToCart(0);
    console.log("Added first product to cart");

    // Wait for cart badge to update
    await expect(productListPage.cartBadge).toBeVisible({ timeout: 5000 });

    // Verify cart badge shows correct count after first item
    const expectedCount1 = initialCartCount + 1;
    await expect(productListPage.cartBadge).toHaveText(
      expectedCount1.toString(),
      { timeout: 5000 }
    );
    console.log(`Cart badge updated to ${expectedCount1}`);

    // Add second product to cart
    await productListPage.addProductToCart(1);
    console.log("Added second product to cart");

    // Verify cart badge shows correct count after second item
    const expectedCount2 = initialCartCount + 2;
    await expect(productListPage.cartBadge).toHaveText(
      expectedCount2.toString(),
      { timeout: 5000 }
    );
    console.log(`Cart badge updated to ${expectedCount2}`);

    //Navigation with Retry
    // Go to cart with retry logic
    try {
      await productListPage.navigateToCart();
    } catch (error) {
      console.log("Failed to navigate to cart on first attempt, retrying...");
      await page.waitForTimeout(1000);
      await productListPage.navigateToCart();
    }

    //Cart Page Verification

    // Wait for cart page to load
    await expect(page).toHaveURL(/.*cart.html/, { timeout: 10000 });

    // Wait to ensure cart items are loaded
    await page.waitForTimeout(1000);

    // Final Verification

    // Verify cart has the correct number of items
    const cartItems = await cartPage.getCartItems();
    console.log(`Found ${cartItems.length} items in cart`);
    expect(cartItems.length).toBe(expectedCount2);
  });
});
