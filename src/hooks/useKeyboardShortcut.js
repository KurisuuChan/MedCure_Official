import { useEffect } from "react";

// Hook for using keyboard shortcuts in components
export const useKeyboardShortcut = (keys, callback, deps = []) => {
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
        return;

      const keyCombo = [
        e.ctrlKey && "ctrl",
        e.metaKey && "cmd",
        e.altKey && "alt",
        e.shiftKey && "shift",
        e.key.toLowerCase(),
      ]
        .filter(Boolean)
        .join("+");

      if (keys.includes(keyCombo)) {
        e.preventDefault();
        callback(e);
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [keys, callback, ...deps]);
};
