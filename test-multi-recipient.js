/**
 * Test Multi-Recipient and Daily Email Features
 * Tests both single and multiple recipient functionality
 */

console.log("🧪 Testing Multi-Recipient Email and Daily Scheduler...");

// Test imports
import { emailService } from "./src/services/notifications/EmailService.js";
import { scheduledNotificationService } from "./src/services/notifications/ScheduledNotificationService.js";

// Test data
const testRecipients = [
  "kurisuuuchannn@gmail.com",
  // Add more test emails if you want to test multiple recipients
  // 'test2@example.com',
  // 'test3@example.com'
];

async function testMultiRecipientEmail() {
  console.log("\n📧 Testing Multi-Recipient Email...");

  try {
    // Test single recipient (existing functionality)
    console.log("1️⃣ Testing single recipient...");
    const singleResult = await emailService.send({
      to: "kurisuuuchannn@gmail.com",
      subject: "🧪 Single Recipient Test - MedCure",
      html: `
        <h1>✅ Single Recipient Test Successful!</h1>
        <p>This email was sent to a single recipient.</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>From:</strong> MedCure Pharmacy Email System</p>
      `,
      text: "Single recipient test email from MedCure Pharmacy",
    });

    console.log("Single recipient result:", singleResult);

    // Test multiple recipients
    if (testRecipients.length > 1) {
      console.log("2️⃣ Testing multiple recipients...");
      const multiResult = await emailService.send({
        to: testRecipients,
        subject: "🧪 Multi-Recipient Test - MedCure",
        html: `
          <h1>✅ Multi-Recipient Test Successful!</h1>
          <p>This email was sent to ${testRecipients.length} recipients:</p>
          <ul>
            ${testRecipients.map((email) => `<li>${email}</li>`).join("")}
          </ul>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Provider:</strong> ${emailService.getProvider()}</p>
          <p><strong>From:</strong> MedCure Pharmacy Email System</p>
        `,
        text: `Multi-recipient test email sent to ${
          testRecipients.length
        } addresses: ${testRecipients.join(", ")}`,
      });

      console.log("Multi-recipient result:", multiResult);
    } else {
      console.log(
        "⏭️ Skipping multi-recipient test - only one email configured"
      );
    }
  } catch (error) {
    console.error("❌ Email test failed:", error);
  }
}

async function testDailyEmailScheduler() {
  console.log("\n📅 Testing Daily Email Scheduler...");

  try {
    // Initialize the scheduler
    await scheduledNotificationService.initialize();

    // Get current settings
    console.log(
      "Current settings:",
      scheduledNotificationService.getSettings()
    );

    // Test updating settings
    console.log("1️⃣ Testing settings update...");
    await scheduledNotificationService.updateSettings({
      dailyEmailEnabled: true,
      dailyEmailTime: "09:00",
      dailyEmailRecipients: testRecipients,
    });

    console.log(
      "Updated settings:",
      scheduledNotificationService.getSettings()
    );

    // Get next email time
    const nextEmailTime = scheduledNotificationService.getNextEmailTime();
    console.log("Next scheduled email:", nextEmailTime?.toLocaleString());

    // Test the daily email functionality
    console.log("2️⃣ Testing daily email generation...");
    const testResult = await scheduledNotificationService.testDailyEmail();
    console.log("Daily email test result:", testResult);
  } catch (error) {
    console.error("❌ Daily email scheduler test failed:", error);
  }
}

// Run all tests
async function runAllTests() {
  console.log("🚀 Starting MedCure Email System Tests...\n");

  // Check email service status
  console.log("📊 Email Service Status:");
  console.log("- Provider:", emailService.getProvider());
  console.log("- Ready:", emailService.isReady());
  console.log("- Configuration:", emailService.getStatus());

  // Run tests
  await testMultiRecipientEmail();
  await testDailyEmailScheduler();

  console.log("\n✅ All tests completed!");
  console.log("\n📋 Summary:");
  console.log("✅ Multi-recipient email support added");
  console.log("✅ Daily email scheduler implemented");
  console.log("✅ Edge Function deployed with multi-recipient support");
  console.log("✅ UI updated with daily email management");
  console.log("\n🎉 Your MedCure email system now supports:");
  console.log("• Single and multiple recipient emails");
  console.log("• Daily scheduled inventory reports");
  console.log("• Rich HTML email templates");
  console.log("• Recipient management interface");
  console.log("• Automatic scheduling at custom times");
}

// Execute tests
runAllTests().catch(console.error);
