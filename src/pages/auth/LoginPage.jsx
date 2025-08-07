// src/pages/auth/LoginPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { supabase } from "@/supabase/client";

const LoginPage = ({ onLogin, branding }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      setError(""); // Clear previous errors
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      onLogin();
      navigate("/");
    } catch (error) {
      const errorMessage = error.error_description || error.message;
      setError(errorMessage);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-blue-100 font-sans">
      <div className="w-full max-w-lg p-12 space-y-8 bg-white rounded-2xl shadow-xl">
        <div className="flex justify-center">
          <img src={branding.url} alt="MedCure Logo" className="h-20 w-20" />
        </div>
        <div className="text-center">
          <h2 className="text-4xl font-light text-gray-800">Welcome Back</h2>
          <p className="mt-2 text-lg text-gray-500">
            Please enter your email and password to log in.
          </p>
          {error && <p className="text-red-500 text-center mt-4">{error}</p>}
        </div>

        <form
          className="w-4/5 mx-auto space-y-8"
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
        >
          {/* ... rest of your form ... */}
          <div className="relative">
            <label
              htmlFor="email-address"
              className="absolute left-4 -top-2 bg-white px-1 text-sm text-gray-600"
            >
              Email
            </label>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full px-4 py-3 text-lg text-gray-800 bg-white border border-gray-400 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="relative">
            <label
              htmlFor="password"
              className="absolute left-4 -top-2 bg-white px-1 text-sm text-gray-600"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full px-4 py-3 text-lg text-gray-800 bg-white border border-gray-400 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full flex justify-between items-center py-3 px-6 border border-transparent text-lg font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset- focus:ring-indigo-00"
            >
              <span>Continue</span>
              <span>&rarr;</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

LoginPage.propTypes = {
  onLogin: PropTypes.func.isRequired,
  branding: PropTypes.shape({
    url: PropTypes.string,
    name: PropTypes.string,
  }).isRequired,
};

export default LoginPage;
