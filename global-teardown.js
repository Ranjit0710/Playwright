"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
/**
 * Global teardown function that runs after all tests
 * Used for cleanup and report aggregation
 */
async function globalTeardown(config) {
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
async function aggregateTestResults(config) {
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
            const passedTests = results.filter((test) => test.status === "passed").length;
            const failedTests = results.filter((test) => test.status === "failed").length;
            const skippedTests = results.filter((test) => test.status === "skipped").length;
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
            fs.writeFileSync(path.join(reportsDir, "summary.json"), JSON.stringify(summary, null, 2));
            console.log("Test results summary:");
            console.log(`Total: ${totalTests}`);
            console.log(`Passed: ${passedTests}`);
            console.log(`Failed: ${failedTests}`);
            console.log(`Skipped: ${skippedTests}`);
            console.log(`Pass Rate: ${passRate.toFixed(2)}%`);
        }
    }
    catch (error) {
        console.error("Error aggregating test results:", error);
    }
}
exports.default = globalTeardown;
