
import React from "react";
import {
  BrowserRouter,
  useLocation,
} from "react-router-dom";

import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";

// Global error boundary
class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      hasError: false,
    };
  }

  static getDerivedStateFromError() {
    return {
      hasError: true,
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Application Error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: "24px",
            textAlign: "center",
            fontFamily: "Arial, sans-serif",
            background: "linear-gradient(135deg, #e0f7fa, #e8eaf6)",
            color: "#17324d",
          }}
        >
          <h2>Something went wrong!</h2>

          <p>
            The application encountered an unexpected error.
            Please reload the page and try again.
          </p>

          <button
            type="button"
            onClick={this.handleReload}
            style={{
              border: "none",
              borderRadius: "8px",
              padding: "12px 22px",
              background: "linear-gradient(135deg, #06b6d4, #2563eb)",
              color: "#ffffff",
              fontSize: "15px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Handles application routes
function AppContent() {
  const location = useLocation();

  React.useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "auto",
    });
  }, [location.pathname]);

  return <AppRoutes />;
}

function App() {
  return (
    <AppErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </AppErrorBoundary>
  );
}

export default App;
