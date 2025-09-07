import { Loader2 } from "lucide-react";

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
  xl: "w-12 h-12",
};

export const LoadingSpinner = ({ size = "md", className = "", text = "" }) => {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 ${className}`}
    >
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );
};
