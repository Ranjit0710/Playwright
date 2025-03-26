Playwright E-commerce Testing Framework
A comprehensive, maintainable, and scalable test automation framework built with Playwright for e-commerce websites.
Features
Core Testing Capabilities

Cross-browser testing: Chrome, Firefox, Safari (WebKit), and mobile browsers
Multi-page testing: Control multiple tabs and windows
Responsive design testing: Emulate various devices and screen sizes

Performance & Reliability

Smart waiting: Automatic waiting for elements to be actionable
Parallel execution: Run tests concurrently for faster results
Retry logic: Automatic retry for flaky tests
Visual evidence: Screenshots, videos, and traces for debugging

Advanced Interaction Support

Network interception: Mock API responses and test error scenarios
Geolocation mocking: Test location-dependent features
File handling: Upload and download file testing
Storage manipulation: Control cookies, localStorage, and sessionStorage

Framework Integration

CI/CD ready: GitHub Actions, Jenkins, Azure DevOps, etc.
Reporting: HTML, JSON, and JUnit reports
Test organization: Tags for smoke, regression, and feature-specific tests

Developer Experience

Page Object Model: Organized, maintainable test code
Visual testing: Compare screenshots against baselines
Accessibility testing: Check WCAG compliance
Performance metrics: Measure and report page load times

Project Structure

e-commerce-playwright-framework/
├── config/ # Configuration files
├── data/ # Test data
├── pages/ # Page objects
│ ├── components/ # Reusable page components
├── tests/ # Test files grouped by feature
├── utils/ # Utility helpers
├── fixtures/ # Test fixtures
├── reports/ # Test reports

Getting Started
Prerequisites

Node.js 14 or higher
npm or yarn

Installation

Clone this repository:
bashCopygit clone https://github.com/yourusername/e-commerce-playwright-framework.git
cd e-commerce-playwright-framework

Install dependencies:
bashCopynpm install

Install Playwright browsers:
bashCopynpx playwright install

Environment Setup
Create a .env file in the root directory:
CopyBASE_URL=https://www.saucedemo.com
ENV=staging
TIMEOUT=30000
RETRY_COUNT=2
WORKERS=3
SCREENSHOT_ON_FAILURE=true
VIDEO_ON_FAILURE=true
TRACE_ON_FAILURE=true
Running Tests
Run all tests:
bashCopynpm test
Run tests in headed mode (with browser visible):
bashCopynpm run test:headed
Run tests in a specific browser:
bashCopynpm run test:chrome
npm run test:firefox
npm run test:webkit
Run tests in parallel:
bashCopynpm run test:parallel
Run specific test groups:
bashCopynpm run test:smoke
npm run test:regression
npm run test:visual
Debugging Tests
Run tests in debug mode:
bashCopynpm run test:debug
Use Playwright Inspector:
bashCopynpm run test:ui
Generate code with Codegen:
bashCopynpm run codegen
Viewing Reports
bashCopynpm run report
Test Authoring
Creating Page Objects
Page objects should extend the BasePage class:
typescriptCopyimport { Page, Locator } from '@playwright/test';
import { BasePage } from './base-page';

export class ProductPage extends BasePage {
readonly addToCartButton: Locator;

constructor(page: Page) {
super(page);
this.addToCartButton = page.locator('[data-test="add-to-cart"]');
}

async addToCart(): Promise<void> {
await this.addToCartButton.click();
}
}
Writing Tests
Use the provided fixtures for common scenarios:
typescriptCopyimport { test, expect } from '../fixtures/authentication.fixture';
import { ProductPage } from '../pages/product-page';

test('Add product to cart as authenticated user', async ({ authenticatedPage }) => {
const productPage = new ProductPage(authenticatedPage);
await productPage.goto('/product/1');
await productPage.addToCart();

// Assertions...
});
Data-Driven Testing
Use test data from external sources:
typescriptCopyimport { test } from '@playwright/test';
import { readFileSync } from 'fs';
import path from 'path';

const testData = JSON.parse(
readFileSync(path.join(\_\_dirname, '../data/products.json'), 'utf-8')
);

for (const data of testData) {
test(`Search for product: ${data.name}`, async ({ page }) => {
// Test using data.name, data.category, etc.
});
}
Visual Testing
typescriptCopyimport { test } from '@playwright/test';
import { ProductPage } from '../pages/product-page';

test('Product details visual test', async ({ page }) => {
const productPage = new ProductPage(page);
await productPage.goto('/product/1');

const diffPercentage = await productPage.visualCompare(
page.locator('.product-details'),
'product-details.png'
);

expect(diffPercentage).toBeLessThan(0.1); // 0.1% threshold
});
Extending the Framework
Adding New Page Objects

Create a new file in the pages directory
Extend the BasePage class
Define locators and methods specific to that page

Creating Custom Utilities

Add new utility files in the utils directory
Import and use them in your tests or page objects

Custom Test Fixtures

Create new fixtures in the fixtures directory
Extend existing fixtures or create standalone ones

Best Practices

Keep page objects focused on a single page or component
Use data-test attributes for stable selectors
Write atomic, independent tests
Group related tests in describe blocks
Use appropriate waiting strategies
Add meaningful assertions
Handle test data cleanup in afterEach/afterAll hooks

Contributing

Create a feature branch
Make your changes
Run linting and tests
Submit a pull request
