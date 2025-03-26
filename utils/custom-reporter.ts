import {
  Reporter,
  FullConfig,
  Suite,
  TestCase,
  TestResult,
  FullResult,
} from "@playwright/test/reporter";
import * as fs from "fs";
import * as path from "path";
import { ReportingHelpers } from "./reporting-helpers";

/**
 * CustomReporter extends Playwright's reporter to create enhanced test reports
 */
class CustomReporter implements Reporter {
  private config!: FullConfig;
  private startTime!: number;
  private testResults: any[] = [];
  private reportPath: string = "";

  /**
   * Called once at the beginning of the test run
   * @param config Playwright FullConfig object
   */
  onBegin(config: FullConfig): void {
    this.config = config;
    this.startTime = Date.now();

    // Create reports directory if it doesn't exist
    this.reportPath = path.join(process.cwd(), "reports", "custom-report");
    if (!fs.existsSync(this.reportPath)) {
      fs.mkdirSync(this.reportPath, { recursive: true });
    }

    // Write test configuration to file
    const configSummary = {
      browsers: config.projects.map((project) => project.name),
      timeout: config.projects[0]?.timeout || 0,
      workers: config.workers,
      timestamp: new Date().toISOString(),
      testDir: config.projects[0]?.testDir || "",
    };

    fs.writeFileSync(
      path.join(this.reportPath, "config.json"),
      JSON.stringify(configSummary, null, 2)
    );

    console.log("\n🚀 Starting test execution...");
  }

  /**
   * Called when a test begins
   * @param test TestCase being started
   * @param result Initial test result
   */
  onTestBegin(test: TestCase): void {
    const projectName = test.parent.project()?.name || "";
    console.log(`\n▶️ Running test: ${test.title} [${projectName}]`);
  }

  /**
   * Called after a test ends
   * @param test TestCase that ended
   * @param result Test result
   */
  onTestEnd(test: TestCase, result: TestResult): void {
    // Add test result to collection
    const projectName = test.parent.project()?.name || "";
    const testPath = test.location.file.replace(process.cwd(), "");

    this.testResults.push({
      title: test.title,
      status: result.status,
      duration: result.duration,
      browser: projectName,
      retries: result.retry,
      path: testPath,
      tags: test.titlePath().slice(1, -1),
      timestamp: new Date().toISOString(),
    });

    // Log test result
    const statusEmoji =
      result.status === "passed"
        ? "✅"
        : result.status === "failed"
          ? "❌"
          : result.status === "skipped"
            ? "⏭️"
            : "❓";

    const duration = (result.duration / 1000).toFixed(2);
    console.log(`${statusEmoji} ${test.title} (${duration}s)`);

    // Log retry information if applicable
    if (result.retry > 0) {
      console.log(`   ↪️ Retry #${result.retry}`);
    }

    // Log errors if test failed
    if (result.status === "failed" && result.error) {
      console.log(`   Error: ${result.error.message}`);
    }
  }

  /**
   * Called after all tests finish
   * @param result Full test run result
   */
  onEnd(result: FullResult): void {
    const duration = (Date.now() - this.startTime) / 1000;

    // Calculate statistics
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(
      (test) => test.status === "passed"
    ).length;
    const failedTests = this.testResults.filter(
      (test) => test.status === "failed"
    ).length;
    const skippedTests = this.testResults.filter(
      (test) => test.status === "skipped"
    ).length;
    const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

    // Log summary
    console.log("\n📊 Test Execution Summary:");
    console.log(`   Total Duration: ${duration.toFixed(2)}s`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${passedTests}`);
    console.log(`   Failed: ${failedTests}`);
    console.log(`   Skipped: ${skippedTests}`);
    console.log(`   Pass Rate: ${passRate.toFixed(2)}%`);

    // Generate result JSON
    const testResultsPath = path.join(this.reportPath, "test-results.json");
    fs.writeFileSync(
      testResultsPath,
      JSON.stringify(this.testResults, null, 2)
    );

    // Generate summary JSON
    const summary = {
      startTime: new Date(this.startTime).toISOString(),
      endTime: new Date().toISOString(),
      duration,
      result: result.status,
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      passRate,
    };

    fs.writeFileSync(
      path.join(this.reportPath, "summary.json"),
      JSON.stringify(summary, null, 2)
    );

    // Generate dashboard HTML report
    ReportingHelpers.createDashboardReport(this.reportPath, this.testResults);

    // Log completion
    console.log(`\n📝 Reports generated in: ${this.reportPath}`);

    // Log final status
    if (result.status === "passed") {
      console.log("\n✨ All tests completed successfully!");
    } else {
      console.log("\n⚠️ Some tests failed or were interrupted!");
    }
  }

  /**
   * Called when a test suite starts
   * @param suite Test suite being started
   */
  onStepBegin?(test: TestCase, result: TestResult, step: any): void {
    // Optional: Log step information for debugging
    if (process.env.DEBUG_STEPS === "true") {
      console.log(`   - ${step.title} [Started]`);
    }
  }

  /**
   * Called when a test suite ends
   * @param suite Test suite that ended
   */
  onStepEnd?(test: TestCase, result: TestResult, step: any): void {
    // Optional: Log step completion for debugging
    if (process.env.DEBUG_STEPS === "true") {
      const duration = (step.duration / 1000).toFixed(2);
      console.log(`   - ${step.title} [${duration}s]`);
    }
  }

  /**
   * Called when a test suite starts
   * @param suite Test suite being started
   */
  onSuiteBegin?(suite: Suite): void {
    // Log suite name for organization
    if (suite.title && suite.allTests().length > 0) {
      console.log(`\n📂 Suite: ${suite.title}`);
    }
  }

  /**
   * Called when a test suite ends
   * @param suite Test suite that ended
   */
  onSuiteEnd?(suite: Suite): void {
    // Optional: Log suite completion
    if (suite.title && suite.allTests().length > 0) {
      const passedTests = suite
        .allTests()
        .filter((test) => test.outcome() === "expected").length;
      const totalTests = suite.allTests().length;

      console.log(
        `📂 Suite Completed: ${suite.title} (${passedTests}/${totalTests} passed)`
      );
    }
  }
}

export default CustomReporter;
