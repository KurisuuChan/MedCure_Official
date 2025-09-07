import React, { useEffect, useState } from "react";
import { Keyboard, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const KeyboardShortcuts = () => {
  const navigate = useNavigate();
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e) => {
      // Only trigger shortcuts when not typing in inputs
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
        return;

      // Check for Ctrl/Cmd key combinations
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "d":
            e.preventDefault();
            navigate("/dashboard");
            break;
          case "i":
            e.preventDefault();
            navigate("/management");
            break;
          case "p":
            e.preventDefault();
            navigate("/pos");
            break;
          case "a":
            e.preventDefault();
            navigate("/analytics");
            break;
          case "r":
            e.preventDefault();
            navigate("/reports");
            break;
          case "s":
            e.preventDefault();
            navigate("/settings");
            break;
          case "/":
          case "?":
            e.preventDefault();
            setShowHelp(true);
            break;
          default:
            break;
        }
      }

      // Single key shortcuts (when not in input fields)
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        switch (e.key) {
          case "?":
            e.preventDefault();
            setShowHelp(true);
            break;
          case "Escape":
            setShowHelp(false);
            break;
          default:
            break;
        }
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [navigate]);

  const shortcuts = [
    {
      key: "Ctrl/Cmd + D",
      description: "Go to Dashboard",
      category: "Navigation",
    },
    {
      key: "Ctrl/Cmd + I",
      description: "Go to Inventory Management",
      category: "Navigation",
    },
    {
      key: "Ctrl/Cmd + P",
      description: "Go to Point of Sale",
      category: "Navigation",
    },
    {
      key: "Ctrl/Cmd + A",
      description: "Go to Analytics",
      category: "Navigation",
    },
    {
      key: "Ctrl/Cmd + R",
      description: "Go to Reports",
      category: "Navigation",
    },
    {
      key: "Ctrl/Cmd + S",
      description: "Go to Settings",
      category: "Navigation",
    },
    { key: "?", description: "Show this help", category: "General" },
    { key: "Esc", description: "Close modals/dialogs", category: "General" },
  ];

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {});

  if (!showHelp) {
    return (
      <button
        onClick={() => setShowHelp(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-40"
        title="Keyboard Shortcuts (Press ? for help)"
      >
        <Keyboard className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold flex items-center">
            <Keyboard className="w-6 h-6 mr-2" />
            Keyboard Shortcuts
          </h2>
          <button
            onClick={() => setShowHelp(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
            <div key={category}>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                {category}
              </h3>
              <div className="space-y-2">
                {shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded"
                  >
                    <span className="text-gray-700">
                      {shortcut.description}
                    </span>
                    <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-sm font-mono">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Tips:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>
                • Shortcuts work from any page (except when typing in input
                fields)
              </li>
              <li>• Use Cmd on Mac, Ctrl on Windows/Linux</li>
              <li>• Press Esc to close this dialog</li>
              <li>• Press ? at any time to show shortcuts</li>
            </ul>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 rounded-b-lg">
          <button
            onClick={() => setShowHelp(false)}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};
