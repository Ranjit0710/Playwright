import dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Environment configurations for different environments
 * Allows different settings for dev, staging, and production
 */
const environments = {
  development: {
    baseUrl: "https://www.saucedemo.com",
    apiUrl: "https://www.saucedemo.com/api",
    timeout: 60000,
    retryCount: 1,
    workers: 2,
    screenshotOnFailure: true,
    videoOnFailure: true,
    traceOnFailure: true,
    defaultUserType: "standard",
    defaultBrowser: "chromium",
  },
  staging: {
    baseUrl: "https://www.saucedemo.com",
    apiUrl: "https://www.saucedemo.com/api",
    timeout: 45000,
    retryCount: 2,
    workers: 3,
    screenshotOnFailure: true,
    videoOnFailure: true,
    traceOnFailure: true,
    defaultUserType: "standard",
    defaultBrowser: "chromium",
  },
  production: {
    baseUrl: "https://www.saucedemo.com",
    apiUrl: "https://www.saucedemo.com/api",
    timeout: 30000,
    retryCount: 3,
    workers: 5,
    screenshotOnFailure: true,
    videoOnFailure: false,
    traceOnFailure: false,
    defaultUserType: "standard",
    defaultBrowser: "chromium",
  },
  ci: {
    baseUrl: "https://www.saucedemo.com",
    apiUrl: "https://www.saucedemo.com/api",
    timeout: 30000,
    retryCount: 2,
    workers: 4,
    screenshotOnFailure: true,
    videoOnFailure: true,
    traceOnFailure: true,
    defaultUserType: "standard",
    defaultBrowser: "chromium",
  },
};

// Get current environment from env variable or default to staging
const currentEnv = process.env.ENV || "staging";

// Validate environment
if (!Object.keys(environments).includes(currentEnv)) {
  console.warn(`Environment "${currentEnv}" not found, using staging instead.`);
}

// Get environment config or default to staging
const environmentConfig =
  environments[currentEnv as keyof typeof environments] || environments.staging;

// Override with specific environment variables if provided
const config = {
  ...environmentConfig,
  baseUrl: process.env.BASE_URL || environmentConfig.baseUrl,
  apiUrl: process.env.API_URL || environmentConfig.apiUrl,
  timeout: process.env.TIMEOUT
    ? parseInt(process.env.TIMEOUT)
    : environmentConfig.timeout,
  retryCount: process.env.RETRY_COUNT
    ? parseInt(process.env.RETRY_COUNT)
    : environmentConfig.retryCount,
  workers: process.env.WORKERS
    ? parseInt(process.env.WORKERS)
    : environmentConfig.workers,
  screenshotOnFailure:
    process.env.SCREENSHOT_ON_FAILURE === "true" ||
    environmentConfig.screenshotOnFailure,
  videoOnFailure:
    process.env.VIDEO_ON_FAILURE === "true" || environmentConfig.videoOnFailure,
  traceOnFailure:
    process.env.TRACE_ON_FAILURE === "true" || environmentConfig.traceOnFailure,
  defaultUserType:
    process.env.DEFAULT_USER_TYPE || environmentConfig.defaultUserType,
  defaultBrowser:
    process.env.DEFAULT_BROWSER || environmentConfig.defaultBrowser,
};

export default config;
