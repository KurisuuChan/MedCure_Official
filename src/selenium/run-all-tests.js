/**
 * Comprehensive Test Runner
 * Runs all Selenium tests and generates a summary report
 */

/* eslint-env node */
/* global process */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test suites to run
const testSuites = [
  { name: "Login Tests", file: "tests/login.test.js" },
  { name: "Dashboard Tests", file: "tests/dashboard.test.js" },
  { name: "Inventory Tests", file: "tests/inventory.test.js" },
  { name: "POS Tests", file: "tests/pos.test.js" },
  { name: "Customer Management Tests", file: "tests/customers.test.js" },
  { name: "Supplier Management Tests", file: "tests/suppliers.test.js" },
  { name: "Sales History Tests", file: "tests/sales.test.js" },
  { name: "Reports Tests", file: "tests/reports.test.js" },
  { name: "Settings Tests", file: "tests/settings.test.js" },
];

console.log("🚀 MedCure Selenium Test Suite Runner");
console.log("=".repeat(60));
console.log(`📅 Started at: ${new Date().toLocaleString()}`);
console.log("=".repeat(60));
console.log();

const results = [];
let totalPassed = 0;
let totalFailed = 0;
let totalSkipped = 0;

// Run each test suite
for (const suite of testSuites) {
  console.log(`\n📋 Running: ${suite.name}`);
  console.log("-".repeat(60));

  try {
    const testPath = path.join(__dirname, suite.file);
    const command = `npx mocha "${testPath}" --timeout 30000 --reporter json`;

    const output = execSync(command, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });

    const result = JSON.parse(output);
    const stats = result.stats;

    results.push({
      suite: suite.name,
      passed: stats.passes,
      failed: stats.failures,
      skipped: stats.pending,
      duration: stats.duration,
      success: stats.failures === 0,
    });

    totalPassed += stats.passes;
    totalFailed += stats.failures;
    totalSkipped += stats.pending;

    console.log(`✅ Passed: ${stats.passes}`);
    console.log(`❌ Failed: ${stats.failures}`);
    console.log(`⏭️  Skipped: ${stats.pending}`);
    console.log(`⏱️  Duration: ${(stats.duration / 1000).toFixed(2)}s`);
  } catch (error) {
    console.log(`❌ Test suite failed to run: ${error.message}`);
    results.push({
      suite: suite.name,
      passed: 0,
      failed: 1,
      skipped: 0,
      duration: 0,
      success: false,
      error: error.message,
    });
    totalFailed++;
  }
}

// Generate summary report
console.log("\n\n" + "=".repeat(60));
console.log("📊 TEST SUMMARY REPORT");
console.log("=".repeat(60));
console.log();

console.log("Test Suite Results:");
console.log("-".repeat(60));

results.forEach((result) => {
  const status = result.success ? "✅ PASS" : "❌ FAIL";
  console.log(
    `${status} | ${result.suite.padEnd(35)} | ` +
      `Pass: ${result.passed.toString().padStart(3)} | ` +
      `Fail: ${result.failed.toString().padStart(3)} | ` +
      `Skip: ${result.skipped.toString().padStart(3)}`
  );
});

console.log("-".repeat(60));
console.log(
  `TOTAL: Pass: ${totalPassed} | Fail: ${totalFailed} | Skip: ${totalSkipped}`
);
console.log("=".repeat(60));

// Overall result
const allPassed = totalFailed === 0;
if (allPassed) {
  console.log("\n🎉 ALL TESTS PASSED! 🎉\n");
} else {
  console.log(`\n⚠️  ${totalFailed} TEST(S) FAILED ⚠️\n`);
}

// Save report to file
const reportDir = path.join(__dirname, "../../selenium/reports");
if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir, { recursive: true });
}

const reportPath = path.join(reportDir, `test-report-${Date.now()}.json`);
fs.writeFileSync(
  reportPath,
  JSON.stringify(
    {
      timestamp: new Date().toISOString(),
      summary: {
        totalPassed,
        totalFailed,
        totalSkipped,
        allPassed,
      },
      results,
    },
    null,
    2
  )
);

console.log(`📄 Report saved to: ${reportPath}\n`);
console.log(`📅 Completed at: ${new Date().toLocaleString()}`);

// Exit with appropriate code
process.exit(allPassed ? 0 : 1);
