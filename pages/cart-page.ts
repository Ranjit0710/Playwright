import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./base-page";

/**
 * CartPage represents the shopping cart page
 * Contains methods for cart-related actions
 */
export class CartPage extends BasePage {
  // Page elements
  readonly cartList: Locator;
  readonly cartItems: Locator;
  readonly cartItemNames: Locator;
  readonly cartItemPrices: Locator;
  readonly cartItemQuantities: Locator;
  readonly removeButtons: Locator;
  readonly continueShoppingButton: Locator;
  readonly checkoutButton: Locator;
  readonly pageTitle: Locator;

  /**
   * @param page Playwright page instance
   */
  constructor(page: Page) {
    super(page);

    // Initialize page elements
    this.cartList = page.locator(".cart_list");
    this.cartItems = page.locator(".cart_item");
    this.cartItemNames = page.locator(".inventory_item_name");
    this.cartItemPrices = page.locator(".inventory_item_price");
    this.cartItemQuantities = page.locator(".cart_quantity");
    this.removeButtons = page.locator('button[id^="remove"]');
    this.continueShoppingButton = page.locator(
      '[data-test="continue-shopping"]'
    );
    this.checkoutButton = page.locator('[data-test="checkout"]');
    this.pageTitle = page.locator(".title");
  }

  /**
   * Navigate to cart page
   */
  async goto(): Promise<void> {
    await this.navigate("/cart.html");
    await this.waitForPageLoad();
    await expect(this.pageTitle).toHaveText("Your Cart");
  }

  /**
   * Get all cart items
   * @returns Array of cart item elements
   */
  async getCartItems(): Promise<Locator[]> {
    return await this.cartItems.all();
  }

  /**
   * Get cart item count
   * @returns Number of items in cart
   */
  async getCartItemCount(): Promise<number> {
    return await this.cartItems.count();
  }

  /**
   * Get cart item name by index
   * @param index Item index (0-based)
   * @returns Item name
   */
  async getCartItemName(index: number): Promise<string> {
    const names = await this.cartItemNames.all();
    if (index >= names.length) {
      throw new Error(
        `Item index ${index} is out of range. Only ${names.length} items in cart.`
      );
    }
    return (await names[index].textContent()) || "";
  }

  /**
   * Get cart item price by index
   * @param index Item index (0-based)
   * @returns Item price (including $ sign)
   */
  async getCartItemPrice(index: number): Promise<string> {
    const prices = await this.cartItemPrices.all();
    if (index >= prices.length) {
      throw new Error(
        `Item index ${index} is out of range. Only ${prices.length} items in cart.`
      );
    }
    return (await prices[index].textContent()) || "";
  }

  /**
   * Get cart item quantity by index
   * @param index Item index (0-based)
   * @returns Item quantity
   */
  async getCartItemQuantity(index: number): Promise<number> {
    const quantities = await this.cartItemQuantities.all();
    if (index >= quantities.length) {
      throw new Error(
        `Item index ${index} is out of range. Only ${quantities.length} items in cart.`
      );
    }
    const text = (await quantities[index].textContent()) || "0";
    return parseInt(text, 10);
  }

  /**
   * Remove cart item by index
   * @param index Item index (0-based)
   */
  async removeCartItem(index: number): Promise<void> {
    const removeButtons = await this.removeButtons.all();
    if (index >= removeButtons.length) {
      throw new Error(
        `Item index ${index} is out of range. Only ${removeButtons.length} items in cart.`
      );
    }
    await removeButtons[index].click();
  }

  /**
   * Continue shopping (return to products page)
   */
  async continueShopping(): Promise<void> {
    await this.continueShoppingButton.click();
  }

  /**
   * Proceed to checkout
   */
  async proceedToCheckout(): Promise<void> {
    await this.checkoutButton.click();
  }

  /**
   * Calculate cart total
   * @returns Total price of all items in cart
   */
  async calculateCartTotal(): Promise<number> {
    const count = await this.getCartItemCount();
    let total = 0;

    for (let i = 0; i < count; i++) {
      const priceText = await this.getCartItemPrice(i);
      const price = parseFloat(priceText.replace("$", ""));
      const quantity = await this.getCartItemQuantity(i);
      total += price * quantity;
    }

    return parseFloat(total.toFixed(2));
  }

  /**
   * Check if cart is empty
   * @returns Boolean indicating if cart is empty
   */
  async isCartEmpty(): Promise<boolean> {
    return (await this.getCartItemCount()) === 0;
  }

  /**
   * Check if item exists in cart by name
   * @param itemName Name of item to check
   * @returns Boolean indicating if item exists in cart
   */
  async isItemInCart(itemName: string): Promise<boolean> {
    const count = await this.getCartItemCount();

    for (let i = 0; i < count; i++) {
      const name = await this.getCartItemName(i);
      if (name === itemName) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get index of item in cart by name
   * @param itemName Name of item to find
   * @returns Index of item or -1 if not found
   */
  async getItemIndexByName(itemName: string): Promise<number> {
    const count = await this.getCartItemCount();

    for (let i = 0; i < count; i++) {
      const name = await this.getCartItemName(i);
      if (name === itemName) {
        return i;
      }
    }

    return -1;
  }

  /**
   * Get all cart data
   * @returns Array of objects with item name, price, and quantity
   */
  async getAllCartData(): Promise<
    Array<{ name: string; price: string; quantity: number }>
  > {
    const count = await this.getCartItemCount();
    const items = [];

    for (let i = 0; i < count; i++) {
      items.push({
        name: await this.getCartItemName(i),
        price: await this.getCartItemPrice(i),
        quantity: await this.getCartItemQuantity(i),
      });
    }

    return items;
  }

  /**
   * Verify cart items against expected data
   * @param expectedItems Array of expected items with name, price, and quantity
   * @returns Boolean indicating if cart matches expected items
   */
  async verifyCartItems(
    expectedItems: Array<{ name: string; price: string; quantity: number }>
  ): Promise<boolean> {
    const actualItems = await this.getAllCartData();

    if (actualItems.length !== expectedItems.length) {
      return false;
    }

    // Sort both arrays to ensure consistent comparison
    const sortedActual = [...actualItems].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    const sortedExpected = [...expectedItems].sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    for (let i = 0; i < sortedActual.length; i++) {
      if (
        sortedActual[i].name !== sortedExpected[i].name ||
        sortedActual[i].price !== sortedExpected[i].price ||
        sortedActual[i].quantity !== sortedExpected[i].quantity
      ) {
        return false;
      }
    }

    return true;
  }
}
