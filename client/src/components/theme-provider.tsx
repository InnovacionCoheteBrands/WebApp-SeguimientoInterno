
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useSystemSettings } from "@/hooks/use-system-settings";
import { normalizeTheme } from "@/lib/system-settings";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
    children: React.ReactNode;
    defaultTheme?: Theme;
    storageKey?: string;
};

type ThemeProviderState = {
    theme: Theme;
    setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
    theme: "system",
    setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
    children,
    defaultTheme = "system",
    storageKey = "vite-ui-theme",
}: ThemeProviderProps) {
    const [theme, setTheme] = useState<Theme>(() => {
        const stored = localStorage.getItem(storageKey) as any;
        return (normalizeTheme(stored) as Theme) || defaultTheme;
    });

    // Fetch settings from API (shared cache) to sync theme
    const { data: settings } = useSystemSettings();

    useEffect(() => {
        if (settings?.theme) {
            setTheme(settings.theme as Theme);
        }
    }, [settings]);

    useEffect(() => {
        const root = window.document.documentElement;

        root.classList.remove("light", "dark");

        if (theme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
                .matches
                ? "dark"
                : "light";

            root.classList.add(systemTheme);
            return;
        }

        root.classList.add(theme);
    }, [theme]);

    const setThemeCallback = useCallback((newTheme: Theme) => {
        const normalized = normalizeTheme(newTheme as any) as Theme;
        localStorage.setItem(storageKey, normalized);
        setTheme(normalized);
    }, [storageKey]);

    const value = useMemo(() => ({
        theme,
        setTheme: setThemeCallback,
    }), [theme, setThemeCallback]);

    return (
        <ThemeProviderContext.Provider value={value}>
            {children}
        </ThemeProviderContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeProviderContext);

    if (context === undefined)
        throw new Error("useTheme must be used within a ThemeProvider");

    return context;
};
