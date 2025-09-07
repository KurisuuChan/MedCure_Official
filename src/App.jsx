import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { FullLayout } from "@/components/layout/FullLayout";
import { LoginPage } from "@/pages/LoginPage";
import { Dashboard } from "@/pages/Dashboard";
import { Management } from "@/pages/Management";
import { AlertsPage } from "@/pages/AlertsPage";
import { MovementsPage } from "@/pages/MovementsPage";
import { AnalyticsPage } from "@/pages/AnalyticsPage";
import { POS } from "@/pages/POS";
import { Reports } from "@/pages/Reports";
import { Settings } from "@/pages/Settings";
import { SystemTesting } from "@/pages/SystemTesting";
import { useAuth } from "@/hooks/useAuth";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: (failureCount, error) => {
        // Don't retry on 401/403 errors
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});

function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <FullLayout>
              <Routes>
                <Route
                  path="/"
                  element={<Navigate to="/dashboard" replace />}
                />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/management" element={<Management />} />
                <Route path="/alerts" element={<AlertsPage />} />
                <Route path="/movements" element={<MovementsPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/pos" element={<POS />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/testing" element={<SystemTesting />} />
                <Route
                  path="*"
                  element={<Navigate to="/dashboard" replace />}
                />
              </Routes>
            </FullLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ToastProvider>
            <Router>
              <div className="min-h-screen bg-background text-foreground">
                <AppContent />
                <KeyboardShortcuts />
              </div>
            </Router>
          </ToastProvider>
        </AuthProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
