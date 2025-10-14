import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// Debug tools for development only - prevents loading in production
if (import.meta.env.DEV) {
  import("./debug/SystemValidationRoadmap.js");
  import("./debug/ProfessionalDeveloperMode.js");
  // Load email service debug helper
  const script = document.createElement("script");
  script.src = "/debug_email_service.js";
  script.async = true;
  document.head.appendChild(script);
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
