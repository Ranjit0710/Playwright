import { FullConfig } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Global teardown function that runs after all tests
 * Used for cleanup and report aggregation
 */
async function globalTeardown(config: FullConfig) {
  console.log("🧹 Running global teardown...");

  // Clean up any temporary files or test data
  cleanupTempFiles();

  // Aggregate test results if needed
  await aggregateTestResults(config);

  console.log("✅ Global teardown completed");
}

/**
 * Clean up temporary files created during the test run
 */
function cleanupTempFiles() {
  // Clean up authentication state files if specified in env
  if (process.env.CLEANUP_AUTH_STATES === "true") {
    const files = fs.readdirSync(__dirname);
    for (const file of files) {
      if (file.startsWith("auth-state-") && file.endsWith(".json")) {
        fs.unlinkSync(path.join(__dirname, file));
        console.log(`Removed auth state file: ${file}`);
      }
    }
  }

  // Clean up any other temp files here
}

/**
 * Aggregate test results from multiple reporters
 * @param config Playwright FullConfig object
 */
async function aggregateTestResults(config: FullConfig) {
  const reportsDir = path.join(__dirname, "reports");
  if (!fs.existsSync(reportsDir)) {
    console.log("Reports directory not found. Skipping aggregation.");
    return;
  }

  // Example of aggregating test results from different runs
  try {
    const jsonReportPath = path.join(reportsDir, "test-results.json");
    if (fs.existsSync(jsonReportPath)) {
      const results = JSON.parse(fs.readFileSync(jsonReportPath, "utf-8"));

      // Calculate statistics
      const totalTests = results.length;
      const passedTests = results.filter(
        (test: any) => test.status === "passed"
      ).length;
      const failedTests = results.filter(
        (test: any) => test.status === "failed"
      ).length;
      const skippedTests = results.filter(
        (test: any) => test.status === "skipped"
      ).length;
      const passRate = (passedTests / totalTests) * 100;

      // Save summary
      const summary = {
        timestamp: new Date().toISOString(),
        totalTests,
        passedTests,
        failedTests,
        skippedTests,
        passRate: passRate.toFixed(2) + "%",
      };

      fs.writeFileSync(
        path.join(reportsDir, "summary.json"),
        JSON.stringify(summary, null, 2)
      );

      console.log("Test results summary:");
      console.log(`Total: ${totalTests}`);
      console.log(`Passed: ${passedTests}`);
      console.log(`Failed: ${failedTests}`);
      console.log(`Skipped: ${skippedTests}`);
      console.log(`Pass Rate: ${passRate.toFixed(2)}%`);
    }
  } catch (error) {
    console.error("Error aggregating test results:", error);
  }
}

export default globalTeardown;
