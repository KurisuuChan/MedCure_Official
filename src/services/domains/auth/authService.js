// 🔐 **AUTH SERVICE**
// Handles authentication operations
// Professional database-only implementation with Supabase

import { supabase, isProductionSupabase } from "../../../config/supabase";
import { logDebug, handleError } from "../../core/serviceUtils";
import UserService from "./userService";

export class AuthService {
  static async signIn(email, password) {
    try {
      logDebug(`Attempting sign in for email: ${email}`);

      // In development mode, use mock authentication
      if (!isProductionSupabase) {
        return this.mockSignIn(email, password);
      }

      // 🎯 FIXED: Supabase authentication - don't continue if this fails
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("🚫 [AuthService] Supabase authentication failed:", error.message);
        throw error; // This should stop execution here
      }

      // Only proceed if Supabase authentication was successful
      if (!data.user) {
        throw new Error("Authentication failed - no user data returned");
      }

      // Get user profile data from our custom users table
      const userProfile = await UserService.getUserByEmail(email);
      
      if (!userProfile) {
        throw new Error("User profile not found in database");
      }

      const authData = {
        ...data,
        user: userProfile,
      };

      logDebug("Successfully signed in user", authData);
      return authData;
    } catch (error) {
      console.error("❌ [AuthService] Sign in completely failed:", error.message);
      handleError(error, "Sign in"); // This should re-throw the error
    }
  }

  static async validateCredentials(email, password) {
    try {
      logDebug(`Validating credentials for email: ${email}`);

      // In development mode, use mock validation
      if (!isProductionSupabase) {
        return this.mockValidateCredentials(email, password);
      }

      // For production, we need to validate without actually signing in
      // We can try to sign in and then immediately sign out
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("🚫 [AuthService] Credential validation failed:", error.message);
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: "Authentication failed - no user data returned" };
      }

      // Get user profile data from our custom users table
      const userProfile = await UserService.getUserByEmail(email);
      
      if (!userProfile) {
        return { success: false, error: "User profile not found in database" };
      }

      // Sign them back out since this was just validation
      await supabase.auth.signOut();

      logDebug("Successfully validated credentials for user", userProfile);
      return { success: true, user: userProfile };
    } catch (error) {
      console.error("❌ [AuthService] Credential validation completely failed:", error.message);
      return { success: false, error: error.message };
    }
  }

  static async mockValidateCredentials(email, password) {
    // Mock authentication for development
    const mockUsers = [
      {
        id: "1",
        email: "admin@medcure.com",
        password: "admin123",
        first_name: "Admin",
        last_name: "User",
        role: "admin",
        is_active: true,
      },
      {
        id: "2",
        email: "manager@medcure.com",
        password: "manager123",
        first_name: "Manager",
        last_name: "User",
        role: "manager",
        is_active: true,
      },
      {
        id: "3",
        email: "staff@medcure.com",
        password: "staff123",
        first_name: "Staff",
        last_name: "User",
        role: "staff",
        is_active: true,
      },
      {
        id: "4",
        email: "pharmacist@medcure.com",
        password: "pharma123",
        first_name: "Pharmacist",
        last_name: "User",
        role: "pharmacist",
        is_active: true,
      },
      {
        id: "5",
        email: "employee@medcure.com",
        password: "employee123",
        first_name: "Employee",
        last_name: "User",
        role: "employee",
        is_active: true,
      },
    ];

    const user = mockUsers.find(
      (u) => u.email === email && u.password === password
    );

    if (!user) {
      return { success: false, error: "Invalid email or password" };
    }

    // Remove password from response
    const { password: _, ...userProfile } = user;

    return { success: true, user: userProfile };
  }

  static async mockSignIn(email, password) {
    const result = await this.mockValidateCredentials(email, password);
    
    if (!result.success) {
      throw new Error(result.error);
    }

    return {
      user: result.user,
      session: { access_token: "mock-token", user: result.user },
    };
  }

  static async signOut() {
    try {
      logDebug("Attempting sign out");

      // In development mode, just clear localStorage
      if (!isProductionSupabase) {
        localStorage.removeItem("medcure-current-user");
        logDebug("Successfully signed out (mock)");
        return { success: true };
      }

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Also clear localStorage
      localStorage.removeItem("medcure-current-user");

      logDebug("Successfully signed out");
      return { success: true };
    } catch (error) {
      handleError(error, "Sign out");
    }
  }

  static async getCurrentUser() {
    try {
      logDebug("Fetching current user");

      // In development mode, get user from localStorage
      if (!isProductionSupabase) {
        const storedUser = localStorage.getItem("medcure-current-user");
        if (storedUser) {
          const user = JSON.parse(storedUser);
          logDebug("Successfully fetched current user from localStorage", user);
          return user;
        }
        return null;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const userProfile = await UserService.getUserByEmail(user.email);
        logDebug("Successfully fetched current user", userProfile);
        return userProfile;
      }

      logDebug("No current user found");
      return null;
    } catch (error) {
      handleError(error, "Get current user");
    }
  }

  static async signUp(email, password, userData) {
    try {
      logDebug(`Attempting sign up for email: ${email}`);

      // Supabase authentication signup
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      // Create user profile if signup successful
      if (data.user) {
        const userProfile = await UserService.addUser({
          email,
          ...userData,
          auth_user_id: data.user.id,
        });

        logDebug("Successfully signed up user", userProfile);
        return { ...data, user: userProfile };
      }

      return data;
    } catch (error) {
      handleError(error, "Sign up");
    }
  }

  static async resetPassword(email) {
    try {
      logDebug(`Attempting password reset for email: ${email}`);

      const { data, error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) throw error;

      logDebug("Successfully sent password reset email");
      return data;
    } catch (error) {
      handleError(error, "Reset password");
    }
  }

  static async updatePassword(newPassword) {
    try {
      logDebug("Attempting password update");

      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      logDebug("Successfully updated password");
      return data;
    } catch (error) {
      handleError(error, "Update password");
    }
  }
}

export default AuthService;
