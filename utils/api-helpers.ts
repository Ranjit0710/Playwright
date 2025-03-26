import {
  APIRequestContext,
  request as playwrightRequest,
} from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * API Helpers for making API requests and handling responses
 */
export class ApiHelpers {
  private request: APIRequestContext;
  private baseUrl: string;
  private authToken?: string;

  /**
   * Create a new ApiHelpers instance
   * @param baseUrl Base URL for API requests
   */
  constructor(baseUrl?: string) {
    this.baseUrl =
      baseUrl || process.env.API_URL || "https://www.saucedemo.com/api";
  }

  /**
   * Initialize the API request context
   */
  async init(): Promise<void> {
    this.request = await playwrightRequest.newContext({
      baseURL: this.baseUrl,
      extraHTTPHeaders: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Set authentication token for subsequent requests
   * @param token Authentication token
   */
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  /**
   * Set authentication using storage state from file
   * @param userType User type (e.g., 'standard', 'admin')
   * @returns Boolean indicating if auth state was successfully loaded
   */
  async setAuthFromStorageState(userType: string): Promise<boolean> {
    const storageStatePath = path.join(
      process.cwd(),
      `auth-state-${userType}.json`
    );

    if (!fs.existsSync(storageStatePath)) {
      console.error(`Auth state file for user type '${userType}' not found.`);
      return false;
    }

    try {
      const storageState = JSON.parse(
        fs.readFileSync(storageStatePath, "utf-8")
      );

      // If there's a token in the storage state, use it
      if (storageState.cookies) {
        for (const cookie of storageState.cookies) {
          if (cookie.name === "session-token" || cookie.name === "token") {
            this.authToken = cookie.value;
            break;
          }
        }
      }

      // Re-initialize request with the cookies
      this.request = await playwrightRequest.newContext({
        baseURL: this.baseUrl,
        extraHTTPHeaders: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(this.authToken
            ? { Authorization: `Bearer ${this.authToken}` }
            : {}),
        },
        storageState: storageStatePath,
      });

      return true;
    } catch (error) {
      console.error("Error loading storage state:", error);
      return false;
    }
  }

  /**
   * Make a GET request
   * @param endpoint API endpoint
   * @param params Query parameters
   * @returns Response object
   */
  async get(
    endpoint: string,
    params?: Record<string, string | number | boolean>
  ): Promise<any> {
    // Construct query string
    const queryString = params
      ? "?" +
        Object.entries(params)
          .map(
            ([key, value]) =>
              `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
          )
          .join("&")
      : "";

    // Make GET request
    const response = await this.request.get(`${endpoint}${queryString}`);

    // Check if response is OK
    if (!response.ok()) {
      throw new Error(
        `GET request to ${endpoint} failed with status ${response.status()}`
      );
    }

    // Parse and return response
    return await response.json();
  }

  /**
   * Make a POST request
   * @param endpoint API endpoint
   * @param data Request payload
   * @returns Response object
   */
  async post(endpoint: string, data?: Record<string, any>): Promise<any> {
    // Make POST request
    const response = await this.request.post(endpoint, {
      data: data || {},
    });

    // Check if response is OK
    if (!response.ok()) {
      throw new Error(
        `POST request to ${endpoint} failed with status ${response.status()}`
      );
    }

    // Parse and return response
    return await response.json();
  }

  /**
   * Make a PUT request
   * @param endpoint API endpoint
   * @param data Request payload
   * @returns Response object
   */
  async put(endpoint: string, data?: Record<string, any>): Promise<any> {
    // Make PUT request
    const response = await this.request.put(endpoint, {
      data: data || {},
    });

    // Check if response is OK
    if (!response.ok()) {
      throw new Error(
        `PUT request to ${endpoint} failed with status ${response.status()}`
      );
    }

    // Parse and return response
    return await response.json();
  }

  /**
   * Make a DELETE request
   * @param endpoint API endpoint
   * @returns Response object
   */
  async delete(endpoint: string): Promise<any> {
    // Make DELETE request
    const response = await this.request.delete(endpoint);

    // Check if response is OK
    if (!response.ok()) {
      throw new Error(
        `DELETE request to ${endpoint} failed with status ${response.status()}`
      );
    }

    // Parse and return response
    try {
      return await response.json();
    } catch (error) {
      // Some DELETE endpoints don't return JSON
      return { success: true };
    }
  }

  /**
   * Authenticate with username and password
   * @param username Username
   * @param password Password
   * @returns Authentication response
   */
  async authenticate(username: string, password: string): Promise<any> {
    try {
      // Make login request
      const response = await this.post("/auth/login", { username, password });

      // Set auth token if present in response
      if (response.token) {
        this.setAuthToken(response.token);
      }

      return response;
    } catch (error) {
      console.error("Authentication failed:", error);
      throw error;
    }
  }

  /**
   * Get current user information
   * @returns User information
   */
  async getCurrentUser(): Promise<any> {
    return await this.get("/auth/user");
  }

  /**
   * Get all products
   * @returns List of products
   */
  async getProducts(): Promise<any[]> {
    return await this.get("/inventory");
  }

  /**
   * Get product by ID
   * @param productId Product ID
   * @returns Product information
   */
  async getProduct(productId: string): Promise<any> {
    return await this.get(`/inventory/${productId}`);
  }

  /**
   * Get cart contents
   * @returns Cart contents
   */
  async getCart(): Promise<any> {
    return await this.get("/cart");
  }

  /**
   * Add product to cart
   * @param productId Product ID
   * @returns Updated cart
   */
  async addToCart(productId: string): Promise<any> {
    return await this.post("/cart", { item_id: productId });
  }

  /**
   * Remove product from cart
   * @param productId Product ID
   * @returns Updated cart
   */
  async removeFromCart(productId: string): Promise<any> {
    return await this.delete(`/cart/${productId}`);
  }

  /**
   * Clear cart
   * @returns Empty cart
   */
  async clearCart(): Promise<any> {
    return await this.delete("/cart");
  }

  /**
   * Create an order
   * @param orderDetails Order details
   * @returns Order confirmation
   */
  async createOrder(orderDetails: any): Promise<any> {
    return await this.post("/checkout/complete", orderDetails);
  }

  /**
   * Dispose the request context
   */
  async dispose(): Promise<void> {
    await this.request.dispose();
  }
}

/**
 * Usage example:
 *
 * const api = new ApiHelpers();
 * await api.init();
 * await api.authenticate('standard_user', 'secret_sauce');
 * const products = await api.getProducts();
 * console.log(products);
 * await api.dispose();
 *
 * // Or using storage state:
 * const api = new ApiHelpers();
 * await api.init();
 * await api.setAuthFromStorageState('standard');
 * const cart = await api.getCart();
 * console.log(cart);
 * await api.dispose();
 */
