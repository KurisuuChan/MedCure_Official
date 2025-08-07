import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import Management from "./pages/Management";
import Archived from "./pages/Archived";
import Notification from "./pages/Notification";
import PointOfSales from "./pages/PointOfSales";
import Contacts from "./pages/Contacts";
import Settings from "./pages/Settings";
import LoginPage from "./pages/auth/LoginPage";
import { supabase } from "@/supabase/client";
import defaultLogo from "@/assets/images/logo-transparent.png";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true); // New state to track auth check
  const [branding, setBranding] = useState({
    name: "MedCure",
    url: defaultLogo,
  });

  const fetchSessionAndBranding = async () => {
    try {
      // Check for active session
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
      setUser(session?.user ?? null);

      // Fetch branding info
      const { data: brandingData } = await supabase
        .from("branding")
        .select("name, logo_url")
        .eq("id", 1)
        .single();
      if (brandingData) {
        setBranding({ name: brandingData.name, url: brandingData.logo_url });
      }
    } catch (error) {
      console.error("Error fetching initial data:", error);
    } finally {
      // Once done, set loading to false
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionAndBranding();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setIsLoggedIn(!!session);
        setUser(session?.user ?? null);
        // Ensure loading is false after auth state changes
        setAuthLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogin = () => {
    // After login, re-fetch session to be sure
    fetchSessionAndBranding();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setUser(null);
  };

  // While checking for a session, display a loading screen
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-2xl font-semibold text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      {isLoggedIn ? (
        // If logged in, render the main app layout with all its pages
        <Route
          path="/*"
          element={
            <div className="flex h-screen bg-gray-200">
              <Sidebar branding={branding} />
              <div className="flex-1 flex flex-col overflow-hidden">
                <Header handleLogout={handleLogout} user={user} />
                <main className="flex-1 p-6 overflow-auto bg-gradient-to-br from-white to-gray-100">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/management" element={<Management />} />
                    <Route path="/archived" element={<Archived />} />
                    <Route path="/notification" element={<Notification />} />
                    <Route path="/point-of-sales" element={<PointOfSales />} />
                    <Route path="/contacts" element={<Contacts />} />
                    <Route
                      path="/settings"
                      element={<Settings onUpdate={fetchSessionAndBranding} />}
                    />
                    {/* Any other path redirects to the dashboard */}
                    <Route path="*" element={<Navigate to="/" />} />
                  </Routes>
                </main>
              </div>
            </div>
          }
        />
      ) : (
        // If not logged in, only show the login page
        <>
          <Route
            path="/login"
            element={<LoginPage onLogin={handleLogin} branding={branding} />}
          />
          {/* Any other path redirects to the login page */}
          <Route path="*" element={<Navigate to="/login" />} />
        </>
      )}
    </Routes>
  );
}

export default App;
