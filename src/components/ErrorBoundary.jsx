import React from "react";
import { WifiOff, RefreshCw } from "lucide-react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen text-center p-8 bg-gray-100">
          <WifiOff size={48} className="text-red-500 mb-4" />
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">
            Something went wrong.
          </h1>
          <p className="text-gray-600 mb-6">
            We've encountered an unexpected error. Please try refreshing the
            page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-md"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
