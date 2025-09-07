import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Settings,
  X,
  Pill,
  Bell,
  Activity,
  History,
  TestTube,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "pharmacist", "cashier"],
  },
  {
    name: "Inventory Management",
    href: "/management",
    icon: Package,
    roles: ["admin", "pharmacist"],
  },
  {
    name: "Inventory Alerts",
    href: "/alerts",
    icon: Bell,
    roles: ["admin", "pharmacist"],
  },
  {
    name: "Stock Movement",
    href: "/movements",
    icon: History,
    roles: ["admin", "pharmacist"],
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: Activity,
    roles: ["admin", "pharmacist"],
  },
  {
    name: "Point of Sale",
    href: "/pos",
    icon: ShoppingCart,
    roles: ["admin", "pharmacist", "cashier"],
  },
  {
    name: "Reports",
    href: "/reports",
    icon: BarChart3,
    roles: ["admin", "pharmacist"],
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    roles: ["admin"],
  },
  {
    name: "System Testing",
    href: "/testing",
    icon: TestTube,
    roles: ["admin"],
  },
];

export const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { userProfile } = useAuth();

  const filteredNavigation = navigation.filter((item) =>
    item.roles.includes(userProfile?.role || "cashier")
  );

  return (
    <div
      className={`
      fixed inset-y-0 left-0 z-50 w-64 bg-sidebar transform transition-transform duration-300 ease-in-out
      ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
    `}
    >
      <div className="flex h-16 items-center justify-between px-6 bg-sidebar border-b border-border/10">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Pill className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="text-lg font-semibold text-sidebar-foreground">
            Medcure
          </h1>
        </div>

        {/* Close button for mobile */}
        <button
          onClick={onClose}
          className="lg:hidden p-1 text-sidebar-foreground hover:bg-white/10 rounded-md"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="mt-6 px-3">
        <ul className="space-y-1">
          {filteredNavigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <li key={item.name}>
                <NavLink
                  to={item.href}
                  onClick={onClose} // Close sidebar on mobile when navigating
                  className={`
                    group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors
                    ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-sidebar-foreground hover:bg-white/10 hover:text-white"
                    }
                  `}
                >
                  <item.icon
                    className={`
                      mr-3 h-5 w-5 transition-colors
                      ${
                        isActive
                          ? "text-primary-foreground"
                          : "text-sidebar-foreground/70 group-hover:text-white"
                      }
                    `}
                  />
                  {item.name}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User info section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border/10">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
            <span className="text-sm font-medium text-sidebar-foreground">
              {userProfile?.full_name?.charAt(0) || "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {userProfile?.full_name || "User"}
            </p>
            <p className="text-xs text-sidebar-foreground/70 capitalize">
              {userProfile?.role || "cashier"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
