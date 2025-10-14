import React from "react";
import ResendTestPanel from "../components/notifications/ResendTestPanel";

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

        <ResendTestPanel />
      </div>
    </div>
  );
};

export default EmailTestPage;
