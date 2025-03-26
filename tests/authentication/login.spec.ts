import { test, expect } from "@playwright/test";
import { LoginPage } from "../../pages/login-page";
import { ProductListPage } from "../../pages/product-list-page";
import * as fs from "fs";
import * as path from "path";

// Load test users data or use defaults
let testUsers;
try {
  const testDataPath = path.join(__dirname, "../../data/test-users.json");
  testUsers = JSON.parse(fs.readFileSync(testDataPath, "utf-8"));
  console.log("Successfully loaded test users data");
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
    {
      type: "locked_out",
      username: "locked_out_user",
      password: "secret_sauce",
      description: "User that has been locked out",
    },
  ];
}

interface TestUser {
  type: string;
  username: string;
  password: string;
  description: string;
}

// Removed conflicting interfaces - we'll use the actual classes instead

test.describe("Login Functionality", () => {
  let loginPage: LoginPage;
  let productListPage: ProductListPage;

  // Before each test, navigate to the login page
  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    productListPage = new ProductListPage(page);

    await loginPage.goto();
  });

  test("Verify login page elements are displayed correctly @smoke", async () => {
    await loginPage.verifyLoginFormElements();
  });

  test("Successful login with standard user @smoke", async ({ page }) => {
    // Increase timeout for this test
    test.setTimeout(30000);

    const standardUser: TestUser | undefined = testUsers.find(
      (user: TestUser) => user.type === "standard"
    );
    console.log("Using standard user:", standardUser?.username);

    if (!standardUser) {
      throw new Error("Standard user not found in test data");
    }

    await loginPage.login(standardUser.username, standardUser.password);

    // Use a more flexible URL matcher with longer timeout
    await expect(page).toHaveURL(/.*inventory.html/, { timeout: 15000 });

    // Verify we're on the inventory page
    try {
      await expect(productListPage.productTitle).toBeVisible({
        timeout: 10000,
      });
    } catch (error) {
      // Log the current URL for debugging
      console.log("Current URL:", page.url());
      throw error;
    }
  });

  test("Login with locked out user shows error message @regression", async () => {
    const lockedOutUser: TestUser | undefined = testUsers.find(
      (user: TestUser) => user.type === "locked_out"
    );

    if (!lockedOutUser) {
      throw new Error("Locked out user not found in test data");
    }

    await loginPage.login(lockedOutUser.username, lockedOutUser.password);

    // Verify error message
    const errorMessage: string = await loginPage.getErrorMessage();
    expect(errorMessage).toContain(
      "Epic sadface: Sorry, this user has been locked out"
    );
  });

  test("Login with invalid credentials shows error @regression", async () => {
    await loginPage.login("invalid_user", "invalid_password");

    // Verify error message
    const errorMessage: string = await loginPage.getErrorMessage();
    expect(errorMessage).toContain(
      "Epic sadface: Username and password do not match any user"
    );
  });

  test("Login fields validation @regression", async () => {
    // Test empty username
    await loginPage.login("", "secret_sauce");
    let errorMessage: string = await loginPage.getErrorMessage();
    expect(errorMessage).toContain("Epic sadface: Username is required");

    // Clear form and test empty password
    await loginPage.clearLoginForm();
    await loginPage.login("standard_user", "");
    errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toContain("Epic sadface: Password is required");
  });
});
