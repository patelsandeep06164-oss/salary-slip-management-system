import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";

const ThemeContext = createContext(undefined);

const THEME_KEY = "theme";

function getStoredTheme() {
  try {
    if (typeof window === "undefined") {
      return "light";
    }

    const savedTheme = window.localStorage.getItem(THEME_KEY);

    return savedTheme === "dark" || savedTheme === "light"
      ? savedTheme
      : "light";
  } catch {
    return "light";
  }
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getStoredTheme);

  const setTheme = useCallback((nextTheme) => {
    setThemeState((currentTheme) => {
      const resolvedTheme =
        typeof nextTheme === "function"
          ? nextTheme(currentTheme)
          : nextTheme;

      return resolvedTheme === "dark" ? "dark" : "light";
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((currentTheme) =>
      currentTheme === "light" ? "dark" : "light"
    );
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch {
      // The theme still works if browser storage is unavailable.
    }

    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
      isDark: theme === "dark",
    }),
    [theme, setTheme, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error(
      "useTheme must be used inside a ThemeProvider."
    );
  }

  return context;
}

export default ThemeContext;
