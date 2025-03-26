import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./base-page";

/**
 * ProductListPage represents the inventory page with product listings
 * Contains methods for product-related actions
 */
export class ProductListPage extends BasePage {
  // Page elements
  readonly inventoryContainer: Locator;
  readonly productItems: Locator;
  readonly productTitles: Locator;
  readonly productPrices: Locator;
  readonly productDescriptions: Locator;
  readonly addToCartButtons: Locator;
  readonly removeButtons: Locator;
  readonly productImages: Locator;
  readonly sortDropdown: Locator;
  readonly cartBadge: Locator;
  readonly cartLink: Locator;
  readonly burgerMenu: Locator;
  readonly logoutLink: Locator;
  readonly productTitle: Locator; // For verifying page load

  /**
   * @param page Playwright page instance
   */
  constructor(page: Page) {
    super(page);

    // Initialize page elements
    this.inventoryContainer = page.locator("#inventory_container");
    this.productItems = page.locator(".inventory_item");
    this.productTitles = page.locator(".inventory_item_name");
    this.productPrices = page.locator(".inventory_item_price");
    this.productDescriptions = page.locator(".inventory_item_desc");
    this.addToCartButtons = page.locator('button[id^="add-to-cart"]');
    this.removeButtons = page.locator('button[id^="remove"]');
    this.productImages = page.locator(".inventory_item_img");
    this.sortDropdown = page.locator('[data-test="product_sort_container"]');
    this.cartBadge = page.locator(".shopping_cart_badge");
    this.cartLink = page.locator(".shopping_cart_link");
    this.burgerMenu = page.locator("#react-burger-menu-btn");
    this.logoutLink = page.locator("#logout_sidebar_link");
    this.productTitle = page.locator(".title");
  }

  /**
   * Navigate to products page
   */
  async goto(): Promise<void> {
    await this.navigate("/inventory.html");
    await this.waitForPageLoad();
    await expect(this.productTitle).toHaveText("Products");
  }

  /**
   * Get number of products displayed
   * @returns Number of products
   */
  async getProductCount(): Promise<number> {
    return await this.productItems.count();
  }

  /**
   * Get product name by index
   * @param index Product index (0-based)
   * @returns Product name
   */
  async getProductName(index: number): Promise<string> {
    const products = await this.productTitles.all();
    if (index >= products.length) {
      throw new Error(
        `Product index ${index} is out of range. Only ${products.length} products available.`
      );
    }
    return (await products[index].textContent()) || "";
  }

  /**
   * Get product price by index
   * @param index Product index (0-based)
   * @returns Product price (including $ sign)
   */
  async getProductPrice(index: number): Promise<string> {
    const prices = await this.productPrices.all();
    if (index >= prices.length) {
      throw new Error(
        `Product index ${index} is out of range. Only ${prices.length} products available.`
      );
    }
    return (await prices[index].textContent()) || "";
  }

  /**
   * Get product description by index
   * @param index Product index (0-based)
   * @returns Product description
   */
  async getProductDescription(index: number): Promise<string> {
    const descriptions = await this.productDescriptions.all();
    if (index >= descriptions.length) {
      throw new Error(
        `Product index ${index} is out of range. Only ${descriptions.length} products available.`
      );
    }
    return (await descriptions[index].textContent()) || "";
  }

  /**
   * Add product to cart by index
   * @param index Product index (0-based)
   */
  async addProductToCart(index: number): Promise<void> {
    const addButtons = await this.addToCartButtons.all();
    if (index >= addButtons.length) {
      throw new Error(
        `Product index ${index} is out of range. Only ${addButtons.length} products available.`
      );
    }
    await addButtons[index].click();
  }

  /**
   * Remove product from cart by index
   * @param index Product index (0-based)
   */
  async removeProductFromCart(index: number): Promise<void> {
    const removeButtons = await this.removeButtons.all();
    if (index >= removeButtons.length) {
      throw new Error(
        `Product index ${index} is out of range. Only ${removeButtons.length} remove buttons available.`
      );
    }
    await removeButtons[index].click();
  }

  /**
   * Click on product to view details
   * @param index Product index (0-based)
   */
  async openProductDetails(index: number): Promise<void> {
    const productNames = await this.productTitles.all();
    if (index >= productNames.length) {
      throw new Error(
        `Product index ${index} is out of range. Only ${productNames.length} products available.`
      );
    }
    await productNames[index].click();
  }

  /**
   * Sort products by the given option
   * @param sortOption Sort option (az, za, lohi, hilo)
   */
  async sortProducts(sortOption: "az" | "za" | "lohi" | "hilo"): Promise<void> {
    await this.sortDropdown.selectOption(sortOption);
    // Wait for sort to take effect
    await this.page.waitForTimeout(500);
  }

  /**
   * Get current cart item count
   * @returns Number of items in cart (0 if cart is empty)
   */
  async getCartItemCount(): Promise<number> {
    const isVisible = await this.cartBadge.isVisible();
    if (!isVisible) {
      return 0;
    }
    const text = (await this.cartBadge.textContent()) || "0";
    return parseInt(text, 10);
  }

  /**
   * Navigate to cart page
   */
  async navigateToCart(): Promise<void> {
    await this.cartLink.click();
  }

  /**
   * Open burger menu
   */
  async openBurgerMenu(): Promise<void> {
    await this.burgerMenu.click();
    // Wait for menu to open
    await this.page.waitForTimeout(500);
  }

  /**
   * Logout from the application
   */
  async logout(): Promise<void> {
    await this.openBurgerMenu();
    await this.logoutLink.click();
  }

  /**
   * Filter products by text
   * @param searchText Text to search for in product titles or descriptions
   * @returns Indexes of matching products
   */
  async filterProductsByText(searchText: string): Promise<number[]> {
    const matchingIndexes: number[] = [];
    const count = await this.getProductCount();

    for (let i = 0; i < count; i++) {
      const name = await this.getProductName(i);
      const description = await this.getProductDescription(i);

      if (
        name.toLowerCase().includes(searchText.toLowerCase()) ||
        description.toLowerCase().includes(searchText.toLowerCase())
      ) {
        matchingIndexes.push(i);
      }
    }

    return matchingIndexes;
  }

  /**
   * Get all product data
   * @returns Array of product objects with name, price, and description
   */
  async getAllProductData(): Promise<
    Array<{ name: string; price: string; description: string }>
  > {
    const count = await this.getProductCount();
    const products = [];

    for (let i = 0; i < count; i++) {
      products.push({
        name: await this.getProductName(i),
        price: await this.getProductPrice(i),
        description: await this.getProductDescription(i),
      });
    }

    return products;
  }

  /**
   * Verify products are sorted correctly
   * @param sortType Type of sorting to verify
   * @returns Boolean indicating if products are correctly sorted
   */
  async verifyProductSorting(
    sortType: "az" | "za" | "lohi" | "hilo"
  ): Promise<boolean> {
    const products = await this.getAllProductData();

    switch (sortType) {
      case "az":
        // Check alphabetical sorting A-Z
        for (let i = 1; i < products.length; i++) {
          if (products[i - 1].name.localeCompare(products[i].name) > 0) {
            return false;
          }
        }
        break;
      case "za":
        // Check alphabetical sorting Z-A
        for (let i = 1; i < products.length; i++) {
          if (products[i - 1].name.localeCompare(products[i].name) < 0) {
            return false;
          }
        }
        break;
      case "lohi":
        // Check price sorting low-high
        for (let i = 1; i < products.length; i++) {
          const price1 = parseFloat(products[i - 1].price.replace("$", ""));
          const price2 = parseFloat(products[i].price.replace("$", ""));
          if (price1 > price2) {
            return false;
          }
        }
        break;
      case "hilo":
        // Check price sorting high-low
        for (let i = 1; i < products.length; i++) {
          const price1 = parseFloat(products[i - 1].price.replace("$", ""));
          const price2 = parseFloat(products[i].price.replace("$", ""));
          if (price1 < price2) {
            return false;
          }
        }
        break;
    }

    return true;
  }
}
