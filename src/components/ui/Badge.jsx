import { forwardRef } from "react";

export const Badge = forwardRef(
  ({ className = "", variant = "default", children, ...props }, ref) => {
    const variants = {
      default: "bg-primary text-primary-foreground hover:bg-primary/80",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      destructive:
        "bg-destructive text-destructive-foreground hover:bg-destructive/80",
      outline: "text-foreground border border-input",
      success: "bg-green-100 text-green-800 border border-green-200",
      warning: "bg-yellow-100 text-yellow-800 border border-yellow-200",
      error: "bg-red-100 text-red-800 border border-red-200",
    };

    const baseClasses =
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
    const variantClasses = variants[variant] || variants.default;

    return (
      <div
        className={`${baseClasses} ${variantClasses} ${className}`}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Badge.displayName = "Badge";
