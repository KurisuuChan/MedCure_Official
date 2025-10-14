// Test Resend API directly
import fetch from "node-fetch";

async function testResend() {
  try {
    console.log("🧪 Testing Resend API...");

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer re_UydJ2aXe_EQFCiZcF2H9DxftXjZWKo6Cd",
      },
      body: JSON.stringify({
        from: "MedCure Pharmacy <onboarding@resend.dev>",
        to: ["kurisuuuchannn@gmail.com"],
        subject: "Direct Resend API Test",
        html: "<h1>✅ Direct API Test Success!</h1><p>This email was sent directly to Resend API to validate credentials.</p>",
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("❌ Resend API error:", response.status, errorData);
      return;
    }

    const result = await response.json();
    console.log("✅ Email sent successfully:", result);
  } catch (error) {
    console.error("❌ Network error:", error.message);
  }
}

testResend();
