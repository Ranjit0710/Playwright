import { Page, Locator, expect, TestInfo } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
// Fix import statement for pixelmatch
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

/**
 * Visual Comparison utility for comparing screenshots
 */
export class VisualComparison {
  // Default directories
  private static readonly BASELINE_DIR = "visual-baselines";
  private static readonly ACTUAL_DIR = "visual-results";
  private static readonly DIFF_DIR = "visual-diffs";
  private static readonly THRESHOLD = 0.1; // Default threshold (0-1)

  private page: Page;
  private testInfo?: TestInfo;
  private baselineDir: string;
  private actualDir: string;
  private diffDir: string;
  private threshold: number;

  /**
   * Create a new VisualComparison instance
   * @param page Playwright page
   * @param testInfo TestInfo object (optional)
   * @param options Configuration options
   */
  constructor(
    page: Page,
    testInfo?: TestInfo,
    options?: {
      baselineDir?: string;
      actualDir?: string;
      diffDir?: string;
      threshold?: number;
    }
  ) {
    this.page = page;
    this.testInfo = testInfo;

    // Set directories and create if they don't exist
    this.baselineDir = path.join(
      process.cwd(),
      options?.baselineDir || VisualComparison.BASELINE_DIR
    );
    this.actualDir = path.join(
      process.cwd(),
      options?.actualDir || VisualComparison.ACTUAL_DIR
    );
    this.diffDir = path.join(
      process.cwd(),
      options?.diffDir || VisualComparison.DIFF_DIR
    );
    this.threshold = options?.threshold || VisualComparison.THRESHOLD;

    this.ensureDirectoriesExist();
  }

  /**
   * Ensure required directories exist
   */
  private ensureDirectoriesExist(): void {
    [this.baselineDir, this.actualDir, this.diffDir].forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Create a baseline screenshot
   * @param elementOrSelector Element or selector to capture
   * @param name Screenshot name
   * @param options Screenshot options
   */
  async createBaseline(
    elementOrSelector: Locator | string,
    name: string,
    options?: {
      fullPage?: boolean;
      timeout?: number;
    }
  ): Promise<void> {
    // Resolve element
    const element =
      typeof elementOrSelector === "string"
        ? this.page.locator(elementOrSelector)
        : elementOrSelector;

    // Wait for element to be visible
    await element.waitFor({
      state: "visible",
      timeout: options?.timeout || 30000,
    });

    // Take screenshot
    const screenshotBuffer = await element.screenshot({
      timeout: options?.timeout,
    });

    // Save screenshot as baseline
    const baselineFile = path.join(this.baselineDir, `${name}.png`);
    fs.writeFileSync(baselineFile, screenshotBuffer);

    if (this.testInfo) {
      this.testInfo.attachments.push({
        name: `Baseline: ${name}`,
        contentType: "image/png",
        path: baselineFile,
      });
    }
  }

  /**
   * Compare a screenshot against baseline
   * @param elementOrSelector Element or selector to capture
   * @param name Screenshot name
   * @param options Comparison options
   * @returns Difference percentage (0-100)
   */
  async compareWithBaseline(
    elementOrSelector: Locator | string,
    name: string,
    options?: {
      threshold?: number;
      fullPage?: boolean;
      timeout?: number;
      updateBaselines?: boolean;
    }
  ): Promise<number> {
    // Resolve element
    const element =
      typeof elementOrSelector === "string"
        ? this.page.locator(elementOrSelector)
        : elementOrSelector;

    // Wait for element to be visible
    await element.waitFor({
      state: "visible",
      timeout: options?.timeout || 30000,
    });

    // Take actual screenshot
    const actualBuffer = await element.screenshot({
      timeout: options?.timeout,
    });

    // Save actual screenshot
    const actualFile = path.join(this.actualDir, `${name}.png`);
    fs.writeFileSync(actualFile, actualBuffer);

    // Attach actual screenshot to test
    if (this.testInfo) {
      this.testInfo.attachments.push({
        name: `Actual: ${name}`,
        contentType: "image/png",
        path: actualFile,
      });
    }

    // Check if baseline exists
    const baselineFile = path.join(this.baselineDir, `${name}.png`);
    if (!fs.existsSync(baselineFile)) {
      if (options?.updateBaselines) {
        // Create baseline if updating is enabled
        fs.copyFileSync(actualFile, baselineFile);
        return 0;
      } else {
        throw new Error(`Baseline screenshot not found: ${baselineFile}`);
      }
    }

    // Read baseline image
    const baselineBuffer = fs.readFileSync(baselineFile);

    // Convert both images to PNG
    const actualImg = PNG.sync.read(actualBuffer);
    const baselineImg = PNG.sync.read(baselineBuffer);

    // Check dimensions
    if (
      actualImg.width !== baselineImg.width ||
      actualImg.height !== baselineImg.height
    ) {
      throw new Error(
        `Image dimensions don't match. Baseline: ${baselineImg.width}x${baselineImg.height}, ` +
          `Actual: ${actualImg.width}x${actualImg.height}`
      );
    }

    // Create diff PNG
    const { width, height } = actualImg;
    const diff = new PNG({ width, height });

    // Compare images
    const threshold = options?.threshold || this.threshold;

    // Fixed pixelmatch call
    const numDiffPixels = pixelmatch(
      actualImg.data,
      baselineImg.data,
      diff.data,
      width,
      height,
      { threshold }
    );

    // Calculate difference percentage
    const diffPercentage = (numDiffPixels / (width * height)) * 100;

    // Save diff image if there are differences
    if (numDiffPixels > 0) {
      const diffFile = path.join(this.diffDir, `${name}.png`);
      fs.writeFileSync(diffFile, PNG.sync.write(diff));

      // Attach diff image to test
      if (this.testInfo) {
        this.testInfo.attachments.push({
          name: `Diff: ${name} (${diffPercentage.toFixed(2)}%)`,
          contentType: "image/png",
          path: diffFile,
        });
      }
    }

    // Update baseline if specified and different
    if (options?.updateBaselines && numDiffPixels > 0) {
      fs.copyFileSync(actualFile, baselineFile);
    }

    return diffPercentage;
  }

  /**
   * Take a full page screenshot and compare with baseline
   * @param name Screenshot name
   * @param options Comparison options
   * @returns Difference percentage (0-100)
   */
  async compareFullPage(
    name: string,
    options?: {
      threshold?: number;
      timeout?: number;
      updateBaselines?: boolean;
    }
  ): Promise<number> {
    // Take actual screenshot
    const actualBuffer = await this.page.screenshot({
      fullPage: true,
      timeout: options?.timeout,
    });

    // Save actual screenshot
    const actualFile = path.join(this.actualDir, `${name}.png`);
    fs.writeFileSync(actualFile, actualBuffer);

    // Attach actual screenshot to test
    if (this.testInfo) {
      this.testInfo.attachments.push({
        name: `Actual: ${name}`,
        contentType: "image/png",
        path: actualFile,
      });
    }

    // Check if baseline exists
    const baselineFile = path.join(this.baselineDir, `${name}.png`);
    if (!fs.existsSync(baselineFile)) {
      if (options?.updateBaselines) {
        // Create baseline if updating is enabled
        fs.copyFileSync(actualFile, baselineFile);
        return 0;
      } else {
        throw new Error(`Baseline screenshot not found: ${baselineFile}`);
      }
    }

    // Read baseline image
    const baselineBuffer = fs.readFileSync(baselineFile);

    // Convert both images to PNG
    const actualImg = PNG.sync.read(actualBuffer);
    const baselineImg = PNG.sync.read(baselineBuffer);

    // Check dimensions
    if (
      actualImg.width !== baselineImg.width ||
      actualImg.height !== baselineImg.height
    ) {
      throw new Error(
        `Image dimensions don't match. Baseline: ${baselineImg.width}x${baselineImg.height}, ` +
          `Actual: ${actualImg.width}x${actualImg.height}`
      );
    }

    // Create diff PNG
    const { width, height } = actualImg;
    const diff = new PNG({ width, height });

    // Compare images
    const threshold = options?.threshold || this.threshold;

    // Fixed pixelmatch call
    const numDiffPixels = pixelmatch(
      actualImg.data,
      baselineImg.data,
      diff.data,
      width,
      height,
      { threshold }
    );

    // Calculate difference percentage
    const diffPercentage = (numDiffPixels / (width * height)) * 100;

    // Save diff image if there are differences
    if (numDiffPixels > 0) {
      const diffFile = path.join(this.diffDir, `${name}.png`);
      fs.writeFileSync(diffFile, PNG.sync.write(diff));

      // Attach diff image to test
      if (this.testInfo) {
        this.testInfo.attachments.push({
          name: `Diff: ${name} (${diffPercentage.toFixed(2)}%)`,
          contentType: "image/png",
          path: diffFile,
        });
      }
    }

    // Update baseline if specified and different
    if (options?.updateBaselines && numDiffPixels > 0) {
      fs.copyFileSync(actualFile, baselineFile);
    }

    return diffPercentage;
  }

  /**
   * Update all baselines from actual screenshots
   * @param namePattern Optional file name pattern to match
   * @returns Number of updated baselines
   */
  updateAllBaselines(namePattern?: string | RegExp): number {
    let updatedCount = 0;

    if (!fs.existsSync(this.actualDir)) {
      return 0;
    }

    const files = fs.readdirSync(this.actualDir);

    for (const file of files) {
      if (!file.endsWith(".png")) {
        continue;
      }

      if (namePattern) {
        const baseName = path.basename(file, ".png");
        if (typeof namePattern === "string") {
          if (!baseName.includes(namePattern)) {
            continue;
          }
        } else if (!namePattern.test(baseName)) {
          continue;
        }
      }

      const actualFile = path.join(this.actualDir, file);
      const baselineFile = path.join(this.baselineDir, file);

      fs.copyFileSync(actualFile, baselineFile);
      updatedCount++;
    }

    return updatedCount;
  }

  /**
   * Clear all screenshots in actual and diff directories
   */
  clearResults(): void {
    if (fs.existsSync(this.actualDir)) {
      for (const file of fs.readdirSync(this.actualDir)) {
        if (file.endsWith(".png")) {
          fs.unlinkSync(path.join(this.actualDir, file));
        }
      }
    }

    if (fs.existsSync(this.diffDir)) {
      for (const file of fs.readdirSync(this.diffDir)) {
        if (file.endsWith(".png")) {
          fs.unlinkSync(path.join(this.diffDir, file));
        }
      }
    }
  }
}
