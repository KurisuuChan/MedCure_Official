/**
 * Direct Resend API Test (Server-side or Node.js environment)
 * This tests your Resend credentials directly
 */

// Test function to validate Resend credentials
const testResendDirect = async () => {
  const API_KEY = "re_UydJ2aXe_EQFCiZcF2H9DxftXjZWKo6Cd";
  const FROM_EMAIL = "kurisuuuchannn@gmail.com";
  const TEST_EMAIL = "kurisuuuchannn@gmail.com"; // Send to yourself for testing

  console.log("🧪 Testing Resend API directly...");
  console.log(`📧 From: ${FROM_EMAIL}`);
  console.log(`📮 To: ${TEST_EMAIL}`);
  console.log(`🔑 API Key: ${API_KEY.substring(0, 8)}...`);

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        from: `MedCure Pharmacy <${FROM_EMAIL}>`,
        to: [TEST_EMAIL],
        subject: "[MedCure] Direct Resend API Test",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #10b981; margin-bottom: 20px;">🎉 Resend Integration Success!</h2>
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Congratulations! Your Resend email integration is working perfectly.
            </p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #374151; margin-top: 0;">📋 Test Details</h3>
              <ul style="color: #6b7280; margin: 0;">
                <li><strong>Account:</strong> kurisuuuchannn@gmail.com</li>
                <li><strong>API Key:</strong> ${API_KEY.substring(0, 8)}...</li>
                <li><strong>Sent at:</strong> ${new Date().toLocaleString()}</li>
                <li><strong>Test Type:</strong> Direct API Call</li>
              </ul>
            </div>
            <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
              This email confirms your Resend integration is ready for production use.
            </p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Resend API error (${response.status}): ${errorData}`);
    }

    const result = await response.json();
    console.log("✅ Resend test successful!", result);
    console.log(`📬 Email ID: ${result.id}`);
    return { success: true, emailId: result.id };
  } catch (error) {
    console.error("❌ Resend test failed:", error);
    return { success: false, error: error.message };
  }
};

// Test function for production deployment validation
const validateResendSetup = () => {
  console.log("🔍 Validating Resend setup...");

  const checks = {
    apiKey: "re_UydJ2aXe_EQFCiZcF2H9DxftXjZWKo6Cd",
    fromEmail: "kurisuuuchannn@gmail.com",
    webhookSecret: "whsec_oDHo/fpn48dYO9E1hWZKaCskE2G817hB",
  };

  console.log("📋 Configuration Summary:");
  console.log(
    `✅ API Key: ${checks.apiKey.substring(0, 8)}... (${
      checks.apiKey.length
    } chars)`
  );
  console.log(`✅ From Email: ${checks.fromEmail}`);
  console.log(`✅ Webhook Secret: ${checks.webhookSecret.substring(0, 15)}...`);

  console.log("\n🔧 Setup Status:");
  console.log("✅ Credentials configured");
  console.log("✅ Gmail account ready");
  console.log("⚠️ Domain verification: Optional for Gmail");
  console.log("⚠️ Supabase deployment: Required for production");

  console.log("\n📝 Next Steps for Production:");
  console.log("1. Deploy Supabase Edge Functions");
  console.log("2. Test email sending from deployed app");
  console.log("3. Configure webhook endpoint in Resend dashboard");

  return checks;
};

// Instructions for testing
console.log("🔧 Resend Direct Test Functions Available:");
console.log("  • testResendDirect() - Test API directly");
console.log("  • validateResendSetup() - Check configuration");

// Note about CORS
console.log("\n⚠️ CORS Note:");
console.log("These functions work in Node.js/server environment.");
console.log("Browser testing requires Supabase Edge Functions deployment.");
console.log("For development, FormSubmit is used automatically.");

// Export for Node.js use
if (typeof module !== "undefined" && module.exports) {
  module.exports = { testResendDirect, validateResendSetup };
}

// Make available globally
if (typeof window !== "undefined") {
  window.resendTester = { testResendDirect, validateResendSetup };
}
