import { Menu, Bell, LogOut, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const Header = ({ onMenuClick }) => {
  const { userProfile, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <header className="bg-card border-b border-border shadow-sm">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        {/* Left side - Mobile menu button */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Page title or breadcrumbs could go here */}
          <div className="hidden lg:block">
            <h2 className="text-lg font-semibold text-foreground">
              Pharmacy Management System
            </h2>
          </div>
        </div>

        {/* Right side - User actions */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <button className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md">
            <Bell className="h-5 w-5" />
            {/* Notification badge */}
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </button>

          {/* User menu */}
          <div className="flex items-center gap-2 pl-3 border-l border-border">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-foreground">
                {userProfile?.full_name || "User"}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {userProfile?.role || "cashier"}
              </p>
            </div>

            <div className="flex items-center gap-1">
              {/* Profile picture or avatar */}
              <button className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20">
                <User className="h-4 w-4" />
              </button>

              {/* Sign out button */}
              <button
                onClick={handleSignOut}
                className="p-2 text-muted-foreground hover:text-destructive hover:bg-muted rounded-md transition-colors"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
