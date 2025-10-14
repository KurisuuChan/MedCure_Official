/**
 * Email Service Debug Console Helper
 * Run these commands in your browser console to debug email issues
 */

// Make emailService available globally for debugging
console.log("🔧 Email Service Debug Helper Loaded");

// Test 1: Check if EmailService is available
const testEmailServiceAvailability = async () => {
  console.log("🧪 Test 1: Checking EmailService availability...");

  try {
    // Import the service
    const { default: emailService, EMAIL_PROVIDER } = await import(
      "/src/services/notifications/EmailService.js"
    );

    console.log("✅ EmailService imported successfully");
    console.log("📧 EmailService instance:", emailService);
    console.log("🔧 EMAIL_PROVIDER constants:", EMAIL_PROVIDER);

    // Make it globally available
    window.emailService = emailService;
    window.EMAIL_PROVIDER = EMAIL_PROVIDER;

    return emailService;
  } catch (error) {
    console.error("❌ Failed to import EmailService:", error);
    return null;
  }
};

// Test 2: Check service configuration
const checkEmailServiceConfig = (emailService) => {
  console.log("🧪 Test 2: Checking EmailService configuration...");

  if (!emailService) {
    console.error("❌ EmailService not available");
    return;
  }

  console.log("📋 Service Status:", {
    isReady: emailService.isReady(),
    provider: emailService.getProvider(),
    fromEmail: emailService.fromEmail,
    fromName: emailService.fromName,
    apiKey: emailService.apiKey
      ? `${emailService.apiKey.substring(0, 8)}...`
      : "Not set",
  });

  console.log("⚙️ Full Status:", emailService.getStatus());
};

// Test 3: Send a test email
const sendTestEmail = async (toEmail = "test@example.com") => {
  console.log("🧪 Test 3: Sending test email...");

  const emailService = window.emailService;
  if (!emailService) {
    console.error(
      "❌ EmailService not available. Run testEmailServiceAvailability() first."
    );
    return;
  }

  if (!emailService.isReady()) {
    console.error("❌ EmailService not ready. Check configuration.");
    console.log("📋 Status:", emailService.getStatus());
    return;
  }

  try {
    const result = await emailService.send({
      to: toEmail,
      subject: "[Debug] EmailService Test from Console",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #10b981;">🔧 Debug Email Test</h2>
          <p>This email was sent from the browser console using the EmailService debug helper.</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">📋 Debug Details</h3>
            <ul style="color: #6b7280;">
              <li><strong>Sent at:</strong> ${new Date().toLocaleString()}</li>
              <li><strong>Provider:</strong> ${emailService.getProvider()}</li>
              <li><strong>From:</strong> ${emailService.fromEmail}</li>
              <li><strong>Test Source:</strong> Browser Console</li>
            </ul>
          </div>
          <p style="color: #6b7280; font-size: 12px;">
            This is a debug email from MedCure EmailService testing.
          </p>
        </div>
      `,
    });

    console.log("📬 Email Result:", result);
    return result;
  } catch (error) {
    console.error("❌ Email send failed:", error);
    return { success: false, error: error.message };
  }
};

// Test 4: Run all tests
const runAllTests = async (testEmail = "your-email@example.com") => {
  console.log("🚀 Running all EmailService tests...");

  // Test 1: Import service
  const emailService = await testEmailServiceAvailability();

  // Test 2: Check config
  checkEmailServiceConfig(emailService);

  // Test 3: Send email (optional)
  if (testEmail !== "your-email@example.com") {
    await sendTestEmail(testEmail);
  } else {
    console.log(
      'ℹ️ Skipping email test. To test sending, run: sendTestEmail("your-email@example.com")'
    );
  }

  console.log("✅ All tests completed!");
};

// Expose functions globally
window.emailDebug = {
  testEmailServiceAvailability,
  checkEmailServiceConfig,
  sendTestEmail,
  runAllTests,
};

console.log("📋 Available debug functions:");
console.log("  • window.emailDebug.testEmailServiceAvailability()");
console.log("  • window.emailDebug.checkEmailServiceConfig(emailService)");
console.log('  • window.emailDebug.sendTestEmail("your-email@example.com")');
console.log('  • window.emailDebug.runAllTests("your-email@example.com")');

console.log("🎯 Quick start: window.emailDebug.runAllTests()");

// Auto-run basic availability test
testEmailServiceAvailability().then((emailService) => {
  if (emailService) {
    checkEmailServiceConfig(emailService);
  }
});
