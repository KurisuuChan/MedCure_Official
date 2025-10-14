import React, { useState } from "react";
import { Shield, Lock, AlertTriangle, CheckCircle, Eye, EyeOff, UserCheck } from "lucide-react";

/**
 * RefundAuthModal - Admin/Pharmacist approval for employee refund requests
 * 
 * This modal appears ONLY for employees requesting refunds.
 * Admin or Pharmacist must enter their credentials to approve.
 */
const RefundAuthModal = ({
  isOpen,
  onClose,
  onConfirm,
  employeeName,
  transactionAmount,
  refundReason,
  isLoading = false,
}) => {
  const [adminEmail, setAdminEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!adminEmail.trim()) {
      setError("Admin/Pharmacist email is required");
      return;
    }

    if (!password.trim()) {
      setError("Password is required");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adminEmail)) {
      setError("Please enter a valid email address");
      return;
    }

    onConfirm(adminEmail, password);
  };

  const handleClose = () => {
    setAdminEmail("");
    setPassword("");
    setError("");
    setShowPassword(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={handleClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-white bg-opacity-20">
                <UserCheck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Admin/Pharmacist Approval Required
                </h3>
                <p className="text-sm text-orange-100">
                  Employee refund request needs authorization
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Content */}
            <div className="bg-white px-6 py-5">
              {/* Employee Request Info */}
              <div className="mb-6 p-4 bg-amber-50 rounded-lg border-2 border-amber-300">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-amber-900 mb-2">
                      Employee Refund Request
                    </h4>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-amber-700">Requested by:</span>
                        <span className="font-semibold text-amber-900">{employeeName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-amber-700">Refund Amount:</span>
                        <span className="font-bold text-amber-900">
                          ₱{transactionAmount?.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      {refundReason && (
                        <div className="pt-2 border-t border-amber-200">
                          <span className="text-amber-700 block mb-1">Reason:</span>
                          <span className="text-amber-900 font-medium">{refundReason}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Admin/Pharmacist Credentials Input */}
              <div className="mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold text-blue-800 mb-1">
                        Authorization Required
                      </h4>
                      <p className="text-xs text-blue-700">
                        Only Admin or Pharmacist can approve this refund request. Please enter your credentials.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Email Input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Email (Admin/Pharmacist) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => {
                        setAdminEmail(e.target.value);
                        setError("");
                      }}
                      className={`block w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all ${
                        error
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                      placeholder="admin@medcure.com"
                      autoFocus
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                      }}
                      className={`block w-full pl-10 pr-12 py-3 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all ${
                        error
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                      placeholder="Enter your password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                  {error && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      {error}
                    </p>
                  )}
                </div>
              </div>

              {/* Warning Message */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h5 className="text-sm font-medium text-red-800 mb-1">
                      Important Notice
                    </h5>
                    <ul className="text-xs text-red-700 space-y-1 list-disc list-inside">
                      <li>This action cannot be undone</li>
                      <li>Inventory will be restored automatically</li>
                      <li>Transaction will be marked as refunded</li>
                      <li>Customer will receive refund notification</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="bg-gray-50 px-6 py-4 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-3 space-y-reverse sm:space-y-0">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="w-full sm:w-auto px-6 py-2.5 text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !adminEmail.trim() || !password.trim()}
                className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4" />
                    <span>Approve Refund</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RefundAuthModal;
