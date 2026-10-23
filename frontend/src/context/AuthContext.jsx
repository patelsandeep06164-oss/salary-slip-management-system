import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
} from "react";

const AuthContext = createContext(undefined);

const USER_KEY = "user";
const TOKEN_KEY = "token";
const REMEMBER_KEY = "rememberMe";

function getStoredUser() {
  try {
    if (typeof window === "undefined") return null;

    const savedUser = window.localStorage.getItem(USER_KEY);
    return savedUser ? JSON.parse(savedUser) : null;
  } catch {
    return null;
  }
}

function getStoredToken() {
  try {
    if (typeof window === "undefined") return "";

    return window.localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

function storeValue(key, value) {
  try {
    if (typeof window === "undefined") return false;

    if (value === null || value === undefined || value === "") {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(
        key,
        typeof value === "string" ? value : JSON.stringify(value)
      );
    }

    return true;
  } catch {
    return false;
  }
}

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(getStoredUser);
  const [token, setTokenState] = useState(getStoredToken);
  const [loading, setLoading] = useState(false);

  const setUser = useCallback((userData) => {
    setUserState(userData ?? null);
    storeValue(USER_KEY, userData ?? null);
  }, []);

  const setToken = useCallback((authToken) => {
    const nextToken = authToken ? String(authToken) : "";

    setTokenState(nextToken);
    storeValue(TOKEN_KEY, nextToken);
  }, []);

  const login = useCallback((userData, authToken) => {
    if (!userData || typeof userData !== "object" || !authToken) {
      throw new Error(
        "Valid user information and an authentication token are required."
      );
    }

    const nextToken = String(authToken);

    // Save both values before updating the authenticated state.
    const userSaved = storeValue(USER_KEY, userData);
    const tokenSaved = storeValue(TOKEN_KEY, nextToken);

    if (!userSaved || !tokenSaved) {
      storeValue(USER_KEY, null);
      storeValue(TOKEN_KEY, null);

      setUserState(null);
      setTokenState("");

      throw new Error(
        "Unable to save your login session. Please check your browser storage settings."
      );
    }

    setUserState(userData);
    setTokenState(nextToken);
    setLoading(false);
  }, []);

  const logout = useCallback(() => {
    storeValue(USER_KEY, null);
    storeValue(TOKEN_KEY, null);
    storeValue(REMEMBER_KEY, null);

    setUserState(null);
    setTokenState("");
    setLoading(false);
  }, []);

  const role = String(
    user?.role || user?.user?.role || ""
  )
    .trim()
    .toLowerCase();

  const isAuthenticated = Boolean(user && token);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      setLoading,
      setUser,
      setToken,
      login,
      logout,
      role,
      isAuthenticated,
    }),
    [
      user,
      token,
      loading,
      setUser,
      setToken,
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
