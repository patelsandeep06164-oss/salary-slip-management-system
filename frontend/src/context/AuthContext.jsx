
import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
} from "react";

import authService from "../services/authService";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);

  // Update user in memory only.
  const setUser = useCallback((userData) => {
    setUserState(userData ?? null);
  }, []);

  // Login after successful backend authentication.
  const login = useCallback((userData) => {
    if (!userData || typeof userData !== "object") {
      throw new Error("Valid user information is required.");
    }

    setUserState(userData);
    setLoading(false);
  }, []);

  // Verify existing HttpOnly cookie session on app startup.
  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        const response = await authService.getCurrentUser();
        const currentUser =
          response.user || response.data?.user || null;

        if (isMounted) {
          setUserState(currentUser);
        }
      } catch (error) {
        if (isMounted) {
          setUserState(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkSession();

    return () => {
      isMounted = false;
    };
  }, []);

  // Logout from backend and clear local application state.
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUserState(null);
      setLoading(false);
    }
  }, []);

  const role = String(
    user?.role || user?.user?.role || ""
  )
    .trim()
    .toLowerCase();

  const isAuthenticated = Boolean(user);

  const value = useMemo(
    () => ({
      user,
      loading,
      setLoading,
      setUser,
      login,
      logout,
      role,
      isAuthenticated,
    }),
    [
      user,
      loading,
      setUser,
      login,
      logout,
      role,
      isAuthenticated,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error(
      "useAuthContext must be used inside an AuthProvider."
    );
  }

  return context;
}

export default AuthContext;
