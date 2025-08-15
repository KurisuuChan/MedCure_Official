import React, { Suspense } from "react";
import { useAuth } from "@/hooks/useAuth";
import LoadingScreen from "./layouts/LoadingScreen";
import FullLayout from "./layouts/FullLayout";
import AuthLayout from "./layouts/AuthLayout";
import ErrorBoundary from "@/components/ErrorBoundary"; // Import the new ErrorBoundary

const App = () => {
  const {
    isLoggedIn,
    user,
    authLoading,
    branding,
    handleLogout,
    fetchSessionAndBranding,
  } = useAuth();

  if (authLoading) {
    return <LoadingScreen />;
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingScreen />}>
        {isLoggedIn ? (
          <FullLayout
            branding={branding}
            user={user}
            handleLogout={handleLogout}
            onUpdate={fetchSessionAndBranding}
          />
        ) : (
          <AuthLayout onLogin={fetchSessionAndBranding} branding={branding} />
        )}
      </Suspense>
    </ErrorBoundary>
  );
};

export default App;
