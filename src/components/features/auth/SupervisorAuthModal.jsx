import React, { useState } from 'react';
import { Shield, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { authService } from '../../../services/authService';
import { UserManagementService } from '../../../services/domains/auth/userManagementService';

const SupervisorAuthModal = ({ 
  isOpen, 
  onClose, 
  onAuthorized, 
  requiredPermission,
  actionName = "this action"
}) => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate credentials without signing in
      const result = await authService.validateCredentials(credentials.email, credentials.password);
      
      if (!result.success) {
        setError(result.error || 'Invalid email or password');
        return;
      }

      const supervisor = result.user;

      // Check if the supervisor has the required permission
      const hasPermission = UserManagementService.userHasPermission(
        supervisor.role, 
        requiredPermission
      );

      if (!hasPermission) {
        setError(`User ${supervisor.email} does not have permission to authorize ${actionName}`);
        return;
      }

      // Success - call the authorized callback with supervisor info
      onAuthorized({
        supervisor,
        supervisorName: `${supervisor.first_name} ${supervisor.last_name}`,
        supervisorEmail: supervisor.email,
        supervisorRole: supervisor.role,
        authorizedAt: new Date().toISOString()
      });

      // Clear form and close modal
      setCredentials({ email: '', password: '' });
      setError('');
      onClose();

    } catch (error) {
      console.error('❌ Supervisor authentication error:', error);
      setError(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setCredentials({ email: '', password: '' });
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 border border-gray-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-6">
          <div className="flex items-center space-x-3">
            <div className="bg-amber-600 p-2 rounded-lg">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Supervisor Authorization Required</h2>
              <p className="text-amber-100 text-sm">Admin or Pharmacist credentials needed</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-800 text-sm font-medium">Permission Required</p>
                <p className="text-amber-700 text-sm">
                  Your account doesn't have permission to perform {actionName}. 
                  Please ask an Admin or Pharmacist to authorize this action.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div>
              <label htmlFor="supervisor-email" className="block text-sm font-medium text-gray-700 mb-2">
                Supervisor Email
              </label>
              <input
                id="supervisor-email"
                type="email"
                value={credentials.email}
                onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="admin@medcure.com"
                required
                autoComplete="email"
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="supervisor-password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="supervisor-password"
                  type={showPassword ? "text" : "password"}
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Enter supervisor password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !credentials.email || !credentials.password}
                className="flex-1 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Authorize</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
            <Shield className="h-3 w-3" />
            <span>Supervisor authorization ensures secure operations</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupervisorAuthModal;