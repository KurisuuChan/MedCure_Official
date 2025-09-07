import { supabase } from "@/lib/supabase";

// Utility to create test users
// Run this once to create the test users, then remove this file

export const createTestUsers = async () => {
  const users = [
    {
      email: "admin@medcure.com",
      password: "123456",
      userData: {
        full_name: "Admin User",
        role: "admin",
        phone: "+63-917-123-4567",
      },
    },
    {
      email: "pharmacist@medcure.com",
      password: "123456",
      userData: {
        full_name: "Pharmacist User",
        role: "pharmacist",
        phone: "+63-917-234-5678",
      },
    },
    {
      email: "cashier@medcure.com",
      password: "123456",
      userData: {
        full_name: "Cashier User",
        role: "cashier",
        phone: "+63-917-345-6789",
      },
    },
  ];

  console.log("Creating test users...");

  for (const user of users) {
    try {
      // Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          data: user.userData,
        },
      });

      if (error) {
        console.error(`Error creating user ${user.email}:`, error.message);
        continue;
      }

      console.log(`✅ Created user: ${user.email}`);

      // If user was created, also create user profile
      if (data.user) {
        const { error: profileError } = await supabase
          .from("user_profiles")
          .insert([
            {
              id: data.user.id,
              email: user.email,
              full_name: user.userData.full_name,
              role: user.userData.role,
              phone: user.userData.phone,
              is_active: true,
            },
          ]);

        if (profileError) {
          console.error(
            `Error creating profile for ${user.email}:`,
            profileError.message
          );
        } else {
          console.log(`✅ Created profile for: ${user.email}`);
        }
      }

      // Small delay between requests
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (err) {
      console.error(`Unexpected error for ${user.email}:`, err);
    }
  }

  console.log("✨ Test user creation completed!");
};

// Auto-run if this file is imported
if (typeof window !== "undefined") {
  // Only run in browser environment
  console.log(
    "Test user creation utility loaded. Call createTestUsers() in console."
  );
}
