import React from "react";
import EmailTestPanel from "../components/debug/EmailTestPanel";

const EmailTestPage = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            🚀 Resend Email Integration Test
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Test your Resend email integration with your domain configuration.
            This page allows you to send test emails and monitor the delivery
            process.
          </p>
        </div>

        <EmailTestPanel />

        {/* Additional Information */}
        <div className="mt-8 max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              📋 Integration Status
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700">✅ Configured</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Resend API Key: Set</li>
                  <li>• Environment Variables: Loaded</li>
                  <li>• Webhook Secret: Configured</li>
                  <li>• Domain: Ready for setup</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-700">⚙️ Next Steps</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>1. Update VITE_RESEND_FROM_EMAIL with your domain</li>
                  <li>2. Verify domain in Resend dashboard</li>
                  <li>3. Test email sending</li>
                  <li>4. Set up webhook endpoint</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-md">
              <h4 className="font-medium text-blue-800 mb-2">
                🔧 Configuration Notes
              </h4>
              <p className="text-sm text-blue-700">
                Your Resend integration is now prioritized over other email
                services. Make sure to update the FROM_EMAIL in your .env file
                to match your verified domain.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailTestPage;
