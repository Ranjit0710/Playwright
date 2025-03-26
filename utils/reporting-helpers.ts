import { TestInfo } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

/**
 * ReportingHelpers provides utilities for enhancing test reports
 * with additional information and visualizations
 */
export class ReportingHelpers {
  /**
   * Add additional information to the test report
   * @param testInfo Playwright TestInfo object
   * @param info Object containing additional test information
   */
  static addInfoToReport(testInfo: TestInfo, info: Record<string, any>): void {
    // Add annotations to test
    for (const [key, value] of Object.entries(info)) {
      testInfo.annotations.push({ type: key, description: String(value) });
    }
  }

  /**
   * Log performance metrics to report
   * @param testInfo Playwright TestInfo object
   * @param metrics Object containing performance metrics
   */
  static logPerformanceMetrics(
    testInfo: TestInfo,
    metrics: Record<string, number>
  ): void {
    // Create attachment with performance data
    const metricsJson = JSON.stringify(metrics, null, 2);
    testInfo.attachments.push({
      name: "performance-metrics.json",
      contentType: "application/json",
      body: Buffer.from(metricsJson),
    });

    // Also add key metrics as annotations
    if (metrics.domContentLoaded) {
      testInfo.annotations.push({
        type: "DOMContentLoaded",
        description: `${metrics.domContentLoaded.toFixed(2)}ms`,
      });
    }

    if (metrics.load) {
      testInfo.annotations.push({
        type: "LoadTime",
        description: `${metrics.load.toFixed(2)}ms`,
      });
    }
  }

  /**
   * Add a custom HTML report with detailed test information
   * @param testInfo Playwright TestInfo object
   * @param data Data to include in the HTML report
   */
  static createDetailedReport(
    testInfo: TestInfo,
    data: Record<string, any>
  ): void {
    // Create HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Detailed Test Report: ${testInfo.title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; }
          .info-block { margin-bottom: 20px; }
          .success { color: green; }
          .error { color: red; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          tr:nth-child(even) { background-color: #f9f9f9; }
        </style>
      </head>
      <body>
        <h1>Test Report: ${testInfo.title}</h1>
        <div class="info-block">
          <h2>Test Information</h2>
          <p><strong>Status:</strong> <span class="${testInfo.status === "passed" ? "success" : "error"}">${testInfo.status}</span></p>
          <p><strong>Duration:</strong> ${testInfo.duration}ms</p>
          <p><strong>Retry:</strong> ${testInfo.retry}</p>
          <p><strong>Project:</strong> ${testInfo.project.name}</p>
        </div>
        <div class="info-block">
          <h2>Custom Data</h2>
          <table>
            <tr>
              <th>Key</th>
              <th>Value</th>
            </tr>
            ${Object.entries(data)
              .map(
                ([key, value]) => `
              <tr>
                <td>${key}</td>
                <td>${this.formatReportValue(value)}</td>
              </tr>
            `
              )
              .join("")}
          </table>
        </div>
      </body>
      </html>
    `;

    // Write HTML file
    const reportPath = path.join(testInfo.outputDir, "detailed-report.html");
    fs.writeFileSync(reportPath, htmlContent);

    // Add attachment
    testInfo.attachments.push({
      name: "Detailed Report",
      contentType: "text/html",
      path: reportPath,
    });
  }

  /**
   * Format a value for display in HTML report
   * @param value Value to format
   * @returns Formatted string representation
   */
  private static formatReportValue(value: any): string {
    if (value === null || value === undefined) {
      return "<em>null</em>";
    }

    if (typeof value === "object") {
      if (Array.isArray(value)) {
        return `<ul>${value.map((item) => `<li>${this.formatReportValue(item)}</li>`).join("")}</ul>`;
      }

      return `<pre>${JSON.stringify(value, null, 2)}</pre>`;
    }

    if (typeof value === "boolean") {
      return value
        ? '<span class="success">✓ True</span>'
        : '<span class="error">✗ False</span>';
    }

    return String(value);
  }

  /**
   * Create a custom report showing test execution timeline
   * @param testInfo Playwright TestInfo object
   * @param events Array of timestamped events during test
   */
  static createTimelineReport(
    testInfo: TestInfo,
    events: Array<{ time: number; event: string; duration?: number }>
  ): void {
    // Sort events by time
    const sortedEvents = [...events].sort((a, b) => a.time - b.time);

    // Calculate relative times from test start
    const startTime = sortedEvents[0]?.time || 0;
    const timelineEvents = sortedEvents.map((event) => ({
      ...event,
      relativeTime: event.time - startTime,
    }));

    // Create HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Test Timeline: ${testInfo.title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; }
          .timeline { position: relative; margin: 40px 0; padding-bottom: 20px; }
          .timeline::before { content: ''; position: absolute; left: 100px; top: 0; bottom: 0; width: 2px; background: #ccc; }
          .event { position: relative; margin-bottom: 20px; padding-left: 120px; }
          .event::before { content: ''; position: absolute; left: 96px; top: 5px; width: 10px; height: 10px; background: #4682B4; border-radius: 50%; }
          .event-time { position: absolute; left: 0; top: 0; width: 80px; text-align: right; color: #666; }
          .event-duration { color: #666; font-style: italic; }
        </style>
      </head>
      <body>
        <h1>Test Timeline: ${testInfo.title}</h1>
        <div class="timeline">
          ${timelineEvents
            .map(
              (event) => `
            <div class="event">
              <span class="event-time">${event.relativeTime.toFixed(0)}ms</span>
              <div class="event-content">
                <div class="event-name">${event.event}</div>
                ${event.duration ? `<div class="event-duration">Duration: ${event.duration.toFixed(0)}ms</div>` : ""}
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      </body>
      </html>
    `;

    // Write HTML file
    const reportPath = path.join(testInfo.outputDir, "timeline-report.html");
    fs.writeFileSync(reportPath, htmlContent);

    // Add attachment
    testInfo.attachments.push({
      name: "Test Timeline",
      contentType: "text/html",
      path: reportPath,
    });
  }

  /**
   * Create a visual comparison report for visual testing
   * @param testInfo Playwright TestInfo object
   * @param baselinePath Path to baseline image
   * @param actualPath Path to actual image
   * @param diffPath Path to diff image
   * @param diffPercentage Difference percentage
   */
  static createVisualComparisonReport(
    testInfo: TestInfo,
    baselinePath: string,
    actualPath: string,
    diffPath: string,
    diffPercentage: number
  ): void {
    // Read images as base64
    const baselineImage = fs.readFileSync(baselinePath).toString("base64");
    const actualImage = fs.readFileSync(actualPath).toString("base64");
    const diffImage = fs.readFileSync(diffPath).toString("base64");

    // Create HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Visual Comparison: ${testInfo.title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1, h2 { color: #333; }
          .comparison { display: flex; flex-wrap: wrap; gap: 20px; }
          .image-container { border: 1px solid #ddd; padding: 10px; margin-bottom: 20px; }
          .image-container h3 { margin-top: 0; }
          img { max-width: 100%; display: block; }
          .diff-percentage { font-size: 24px; font-weight: bold; margin: 20px 0; }
          .pass { color: green; }
          .fail { color: red; }
        </style>
      </head>
      <body>
        <h1>Visual Comparison: ${testInfo.title}</h1>
        
        <div class="diff-percentage ${diffPercentage <= 0.1 ? "pass" : "fail"}">
          Difference: ${diffPercentage.toFixed(2)}%
        </div>
        
        <div class="comparison">
          <div class="image-container">
            <h3>Baseline</h3>
            <img src="data:image/png;base64,${baselineImage}" alt="Baseline" />
          </div>
          
          <div class="image-container">
            <h3>Actual</h3>
            <img src="data:image/png;base64,${actualImage}" alt="Actual" />
          </div>
          
          <div class="image-container">
            <h3>Difference</h3>
            <img src="data:image/png;base64,${diffImage}" alt="Difference" />
          </div>
        </div>
      </body>
      </html>
    `;

    // Write HTML file
    const reportPath = path.join(
      testInfo.outputDir,
      "visual-comparison-report.html"
    );
    fs.writeFileSync(reportPath, htmlContent);

    // Add attachment
    testInfo.attachments.push({
      name: "Visual Comparison",
      contentType: "text/html",
      path: reportPath,
    });

    // Add annotation
    testInfo.annotations.push({
      type: "VisualDifference",
      description: `${diffPercentage.toFixed(2)}%`,
    });
  }

  /**
   * Create a custom dashboard report summarizing multiple tests
   * @param outputDir Directory to write the report to
   * @param testResults Array of test results
   */
  static createDashboardReport(outputDir: string, testResults: any[]): void {
    // Calculate statistics
    const totalTests = testResults.length;
    const passedTests = testResults.filter(
      (test) => test.status === "passed"
    ).length;
    const failedTests = testResults.filter(
      (test) => test.status === "failed"
    ).length;
    const skippedTests = testResults.filter(
      (test) => test.status === "skipped"
    ).length;
    const passRate = (passedTests / totalTests) * 100;

    // Create HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Test Dashboard</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1, h2 { color: #333; }
          .summary { display: flex; gap: 20px; margin-bottom: 40px; }
          .stat-card { background: #f5f5f5; border-radius: 8px; padding: 20px; flex: 1; text-align: center; }
          .stat-card.pass { background: #e6ffe6; }
          .stat-card.fail { background: #ffe6e6; }
          .stat-value { font-size: 36px; font-weight: bold; margin: 10px 0; }
          .pass-rate { font-size: 48px; color: ${passRate >= 90 ? "green" : passRate >= 70 ? "orange" : "red"}; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background: #f2f2f2; }
          .passed { color: green; }
          .failed { color: red; }
          .skipped { color: orange; }
        </style>
      </head>
      <body>
        <h1>Test Execution Dashboard</h1>
        
        <div class="summary">
          <div class="stat-card">
            <h3>Total Tests</h3>
            <div class="stat-value">${totalTests}</div>
          </div>
          
          <div class="stat-card pass">
            <h3>Passed</h3>
            <div class="stat-value">${passedTests}</div>
          </div>
          
          <div class="stat-card fail">
            <h3>Failed</h3>
            <div class="stat-value">${failedTests}</div>
          </div>
          
          <div class="stat-card">
            <h3>Skipped</h3>
            <div class="stat-value">${skippedTests}</div>
          </div>
          
          <div class="stat-card">
            <h3>Pass Rate</h3>
            <div class="pass-rate">${passRate.toFixed(1)}%</div>
          </div>
        </div>
        
        <h2>Test Results</h2>
        <table>
          <tr>
            <th>Test Name</th>
            <th>Status</th>
            <th>Duration</th>
            <th>Browser</th>
            <th>Retries</th>
          </tr>
          ${testResults
            .map(
              (test) => `
            <tr>
              <td>${test.title}</td>
              <td class="${test.status}">${test.status}</td>
              <td>${test.duration}ms</td>
              <td>${test.browser}</td>
              <td>${test.retries}</td>
            </tr>
          `
            )
            .join("")}
        </table>
      </body>
      </html>
    `;

    // Write HTML file
    const reportPath = path.join(outputDir, "dashboard-report.html");
    fs.writeFileSync(reportPath, htmlContent);

    console.log(`Dashboard report generated at: ${reportPath}`);
  }
}

/**
 * Usage examples:
 *
 * // Add information to test report
 * ReportingHelpers.addInfoToReport(testInfo, {
 *   environment: process.env.ENV,
 *   buildNumber: process.env.BUILD_NUMBER,
 *   testData: 'Custom test data used'
 * });
 *
 * // Log performance metrics
 * const metrics = await page.evaluate(() => ({
 *   domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
 *   load: performance.timing.loadEventEnd - performance.timing.navigationStart
 * }));
 * ReportingHelpers.logPerformanceMetrics(testInfo, metrics);
 *
 * // Create detailed test report
 * ReportingHelpers.createDetailedReport(testInfo, {
 *   apiResponses: responses,
 *   testData: testData,
 *   userActions: actions
 * });
 *
 * // Create timeline report
 * ReportingHelpers.createTimelineReport(testInfo, [
 *   { time: Date.now(), event: 'Test started' },
 *   { time: Date.now() + 1000, event: 'Logged in', duration: 800 },
 *   { time: Date.now() + 2000, event: 'Added product to cart', duration: 500 }
 * ]);
 */
