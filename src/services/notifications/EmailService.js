/**
 * ============================================================================
 * EmailService - Email Provider Abstraction Layer
 * ============================================================================
 *
 * A flexible email service that supports multiple providers:
 * - SendGrid (recommended for production)
 * - Resend (modern alternative)
 * - SMTP (fallback option)
 *
 * Features:
 * - Automatic provider selection based on environment variables
 * - Configuration validation
 * - Error handling with detailed logging
 * - Graceful degradation when email is unavailable
 *
 * @version 1.0.0
 * @date 2025-10-05
 */

/**
 * Supported email providers
 */
const EMAIL_PROVIDER = {
  RESEND: "resend", // Primary: Production-grade service via Edge Function
  NONE: "none",
};

class EmailService {
  constructor() {
    this.provider = null;
    this.apiKey = null;
    this.fromEmail = null;
    this.fromName = "MedCure Pharmacy";
    this.isConfigured = false;

    // Initialize provider
    this.initializeProvider();
  }

  /**
   * Initialize Resend email provider
   */
  initializeProvider() {
    try {
      // Check for Resend (Only supported provider)
      if (import.meta.env.VITE_RESEND_API_KEY) {
        this.provider = EMAIL_PROVIDER.RESEND;
        this.apiKey = import.meta.env.VITE_RESEND_API_KEY;
        this.fromEmail =
          import.meta.env.VITE_RESEND_FROM_EMAIL || "onboarding@resend.dev";
        this.fromName = import.meta.env.VITE_RESEND_FROM_NAME || this.fromName;
        this.isConfigured = true;
        console.log("✅ EmailService configured with Resend");
        console.log(`📧 From: ${this.fromName} <${this.fromEmail}>`);
        console.log(`🔑 API Key: ${this.apiKey.substring(0, 8)}...`);
        console.log("🚀 Using Supabase Edge Function for CORS-free delivery");
        return;
      }

      // No provider configured
      this.provider = EMAIL_PROVIDER.NONE;
      this.isConfigured = false;
      console.warn(
        "⚠️ Resend not configured. Set VITE_RESEND_API_KEY to enable email notifications."
      );
    } catch (error) {
      console.error("❌ Failed to initialize EmailService:", error);
      this.provider = EMAIL_PROVIDER.NONE;
      this.isConfigured = false;
    }
  }

  /**
   * Check if email service is configured
   *
   * @returns {boolean} True if configured
   */
  isReady() {
    return this.isConfigured && this.provider !== EMAIL_PROVIDER.NONE;
  }

  /**
   * Get current provider name
   *
   * @returns {string} Provider name
   */
  getProvider() {
    return this.provider;
  }

  /**
   * Send email using configured provider
   *
   * @param {Object} params - Email parameters
   * @param {string|string[]} params.to - Recipient email address(es) - can be single email or array
   * @param {string} params.subject - Email subject
   * @param {string} params.html - HTML email content
   * @param {string} [params.text] - Plain text alternative
   * @returns {Promise<Object>} Result object with success flag
   */
  async send({ to, subject, html, text }) {
    try {
      // Validate inputs
      if (!to || !subject || !html) {
        throw new Error("Missing required email parameters: to, subject, html");
      }

      // Convert to array for validation and processing
      const recipients = Array.isArray(to) ? to : [to];

      // Validate all email addresses
      for (const email of recipients) {
        if (!this.isEmailValid(email)) {
          throw new Error(`Invalid email address: ${email}`);
        }
      }

      console.log(
        `📧 Sending email to ${
          recipients.length
        } recipient(s): ${recipients.join(", ")}`
      );

      // For multiple recipients, process them appropriately based on provider capabilities
      if (recipients.length > 1) {
        return await this.sendToMultipleRecipients({
          recipients,
          subject,
          html,
          text,
        });
      }

      // Single recipient - use existing logic with first recipient
      const singleTo = recipients[0];

      // Check if configured
      if (!this.isReady()) {
        console.warn("⚠️ Email service not configured, email not sent");
        return {
          success: false,
          reason: "not_configured",
          message: "Email service is not configured",
        };
      }

      // Send using Resend provider
      if (this.provider === EMAIL_PROVIDER.RESEND) {
        return await this.sendViaResend({ to: singleTo, subject, html, text });
      }

      return {
        success: false,
        reason: "no_provider",
        message: "Resend email provider not configured",
      };
    } catch (error) {
      console.error("❌ Failed to send email:", error);
      return {
        success: false,
        reason: "error",
        error: error.message,
      };
    }
  }

  /**
   * Send email to multiple recipients (Resend only)
   * @private
   */
  async sendToMultipleRecipients({ recipients, subject, html, text }) {
    console.log(
      `📧 Processing multi-recipient email to ${recipients.length} addresses`
    );

    if (this.provider === EMAIL_PROVIDER.RESEND) {
      // Resend supports multiple recipients natively
      return await this.sendViaResend({ to: recipients, subject, html, text });
    }

    return {
      success: false,
      reason: "no_provider",
      message: "Resend provider required for multi-recipient emails",
    };
  }

  /**
   * Send email via Resend (using Supabase Edge Function)
   * @private
   */
  async sendViaResend({ to, subject, html, text }) {
    try {
      // Use Supabase Edge Function to avoid CORS issues
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const edgeFunctionUrl = `${supabaseUrl}/functions/v1/send-notification-email`;

      // Convert to array if needed for consistent handling
      const recipients = Array.isArray(to) ? to : [to];

      console.log(
        `📧 Resend: Sending to ${
          recipients.length
        } recipient(s): ${recipients.join(", ")}`
      );

      const requestBody = {
        to: recipients, // Send array to Edge Function
        subject,
        html,
        ...(text ? { text } : {}),
      };

      console.log("🔍 Request details:", {
        url: edgeFunctionUrl,
        method: "POST",
        body: JSON.stringify(requestBody, null, 2),
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer [HIDDEN]",
        },
      });

      const response = await fetch(edgeFunctionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Note: Edge Function deployed with --no-verify-jwt, no auth needed
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        let errorDetails;

        try {
          errorDetails = JSON.parse(errorBody);
        } catch {
          errorDetails = { message: errorBody };
        }

        console.error("🔍 Edge Function Error Details:", {
          status: response.status,
          statusText: response.statusText,
          body: errorBody,
          parsed: errorDetails,
        });

        throw new Error(
          `Email function error (${response.status}): ${
            errorDetails?.error || errorDetails?.message || "Unknown error"
          }`
        );
      }

      const data = await response.json();
      console.log(
        "✅ Email sent successfully via Supabase Edge Function to:",
        recipients.join(", "),
        "(ID:",
        data.emailId || "unknown",
        ")"
      );

      return {
        success: true,
        provider: "resend-edge-function",
        emailId: data.emailId,
        recipients: recipients,
        recipientCount: recipients.length,
      };
    } catch (error) {
      console.error("❌ Edge function email send failed:", error);
      return {
        success: false,
        reason: "edge_function_error",
        error: error.message,
      };
    }
  }

  /**
   * Validate email address format
   * @private
   */
  isEmailValid(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Test email configuration by sending a test email
   *
   * @param {string} testEmail - Email address to send test to
   * @returns {Promise<Object>} Test result
   */
  async testConfiguration(testEmail) {
    if (!testEmail) {
      throw new Error("Test email address is required");
    }

    if (!this.isReady()) {
      throw new Error("Email service is not configured or ready");
    }

    try {
      console.log(`📧 Testing email configuration - sending to ${testEmail}`);

      const result = await this.send({
        to: testEmail,
        subject: "MedCure Email Test - Configuration Verification",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>Email Test</title>
          </head>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 24px; text-align: center; border-radius: 8px;">
              <h1 style="margin: 0; font-size: 24px;">🏥 MedCure Pharmacy</h1>
              <p style="margin: 8px 0 0; opacity: 0.9;">Email Configuration Test</p>
            </div>
            
            <div style="padding: 24px; background: #f8fafc; margin: 16px 0; border-radius: 8px;">
              <h2 style="color: #059669; margin-top: 0;">✅ Email Test Successful!</h2>
              <p>Your MedCure email system is configured correctly and working properly.</p>
              
              <div style="background: white; padding: 16px; border-radius: 6px; margin: 16px 0;">
                <strong>Configuration Details:</strong><br>
                📧 Provider: ${this.provider}<br>
                📨 From Email: ${this.fromEmail}<br>
                👤 From Name: ${this.fromName}<br>
                🕒 Test Time: ${new Date().toLocaleString()}
              </div>
              
              <p><strong>✅ Ready to receive:</strong></p>
              <ul style="color: #374151;">
                <li>🚨 Low stock alerts</li>
                <li>❌ Out of stock warnings</li>
                <li>📅 Product expiry notifications</li>
                <li>🔄 System health updates</li>
              </ul>
            </div>
            
            <div style="text-align: center; padding: 16px; color: #6b7280; font-size: 14px;">
              © ${new Date().getFullYear()} MedCure Pharmacy Management System
            </div>
          </body>
          </html>
        `,
        text: `MedCure Email Test - SUCCESS! Your email system is working correctly. Provider: ${
          this.provider
        }, Time: ${new Date().toLocaleString()}`,
      });

      if (result.success) {
        console.log("✅ Email test successful:", result);
        return {
          success: true,
          message: `Test email sent successfully to ${testEmail}`,
          provider: this.provider,
          timestamp: new Date().toISOString(),
          details: result,
        };
      } else {
        console.error("❌ Email test failed:", result);
        return {
          success: false,
          message: `Test email failed: ${result.error}`,
          provider: this.provider,
          timestamp: new Date().toISOString(),
          error: result.error,
        };
      }
    } catch (error) {
      console.error("❌ Email test error:", error);
      return {
        success: false,
        message: `Test email error: ${error.message}`,
        provider: this.provider,
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  /**
   * Get current configuration status
   *
   * @returns {Object} Configuration details
   */
  getStatus() {
    return {
      isConfigured: this.isConfigured,
      provider: this.provider,
      fromEmail: this.fromEmail,
      fromName: this.fromName,
      ready: this.isReady(),
    };
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const emailService = new EmailService();
export { EMAIL_PROVIDER };
export default emailService;
