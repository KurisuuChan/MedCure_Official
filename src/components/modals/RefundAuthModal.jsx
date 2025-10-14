import React, { useState, useEffect } from "react";
import { Shield, Lock, AlertTriangle, Eye, EyeOff, X, UserCheck } from "lucide-react";
import { supabase } from "../../config/supabase";

/**
 * RefundAuthModal - Admin/Pharmacist password confirmation for employee refund requests
 * 
 * This modal appears ONLY for employees requesting refunds.
 * Admin or Pharmacist must select their name and enter password to approve.
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
  const [approvers, setApprovers] = useState([]);
  const [selectedApprover, setSelectedApprover] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loadingApprovers, setLoadingApprovers] = useState(true);

  // Fetch admin/pharmacist users
  useEffect(() => {
    const fetchApprovers = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, first_name, last_name, email, role')
          .in('role', ['admin', 'pharmacist'])
          .eq('is_active', true)
          .order('first_name');

        if (error) throw error;
        setApprovers(data || []);
      } catch (err) {
        console.error("Error fetching approvers:", err);
        // Fallback to mock data for development
        setApprovers([
          { id: '1', email: 'admin@medcure.com', first_name: 'Admin', last_name: 'User', role: 'admin' }
        ]);
      } finally {
        setLoadingApprovers(false);
      }
    };

    if (isOpen) {
      fetchApprovers();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedApprover) {
      setError("Please select who is approving");
      return;
    }

    if (!password.trim()) {
      setError("Password is required");
      return;
    }

    const approver = approvers.find(a => a.id === selectedApprover);
    onConfirm(approver.email, password);
  };

  const handleClose = () => {
    setSelectedApprover("");
    setPassword("");
    setError("");
    setShowPassword(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal - Wider for 2 columns */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors z-10"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-5 text-center">
          <div className="flex justify-center mb-2">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Shield className="h-7 w-7 text-white" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-white mb-1">
            Refund Authorization Required
          </h3>
          <p className="text-orange-100 text-sm">
            Admin/Pharmacist approval needed
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Content - 2 Column Layout */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* LEFT COLUMN - Request Information */}
              <div className="space-y-4">
                <h4 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  Refund Request Details
                </h4>

                {/* Employee Info */}
                <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">
                    Requested By
                  </p>
                  <p className="text-base font-bold text-amber-900">
                    {employeeName}
                  </p>
                </div>

                {/* Amount */}
                <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-2">
                    Refund Amount
                  </p>
                  <p className="text-3xl font-bold text-orange-900">
                    ₱{transactionAmount?.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>

                {/* Reason */}
                {refundReason && (
                  <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                      Reason for Refund
                    </p>
                    <p className="text-sm text-gray-900 leading-relaxed">
                      {refundReason}
                    </p>
                  </div>
                )}

                {/* Warning */}
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700">
                      <span className="font-semibold">Warning:</span> This action cannot be undone. Inventory will be restored automatically.
                    </p>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN - Authorization Form */}
              <div className="space-y-4">
                <h4 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-blue-600" />
                  Authorization
                </h4>

                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h5 className="text-sm font-semibold text-blue-900 mb-1">
                    Admin/Pharmacist Only
                  </h5>
                  <p className="text-xs text-blue-700">
                    Select your name and enter your password to approve this refund request.
                  </p>
                </div>

                {/* Approver Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Who is approving? <span className="text-red-500">*</span>
                  </label>
                  {loadingApprovers ? (
                    <div className="py-3 px-4 border-2 border-gray-300 rounded-xl text-gray-500 text-center bg-gray-50">
                      Loading approvers...
                    </div>
                  ) : (
                    <select
                      value={selectedApprover}
                      onChange={(e) => {
                        setSelectedApprover(e.target.value);
                        setError("");
                      }}
                      className="block w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-base hover:border-gray-400 bg-white"
                      disabled={isLoading}
                    >
                      <option value="">-- Select your name --</option>
                      {approvers.map((approver) => (
                        <option key={approver.id} value={approver.id}>
                          {approver.first_name} {approver.last_name} ({approver.role})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                      className={`block w-full pl-10 pr-12 py-3 border-2 rounded-xl focus:ring-2 focus:ring-orange-500 transition-all text-base ${
                        error
                          ? "border-red-300 bg-red-50 focus:border-red-500"
                          : "border-gray-300 hover:border-gray-400 focus:border-orange-500"
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
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" />
                      {error}
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isLoading}
                    className="flex-1 px-4 py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !password.trim() || !selectedApprover}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <Shield className="h-5 w-5" />
                        <span>Approve Refund</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RefundAuthModal;
