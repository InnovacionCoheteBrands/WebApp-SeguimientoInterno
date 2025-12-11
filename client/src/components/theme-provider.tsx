
import { createContext, useContext, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

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
        return (localStorage.getItem(storageKey) as Theme) || defaultTheme;
    });

    // Fetch settings from API to sync theme
    const { data: serverSettings } = useQuery({
        queryKey: ["settings"],
        queryFn: async () => {
            // If this fails (e.g. 404 or 500), we just ignore it and use local state
            try {
                const res = await fetch("/api/settings");
                if (!res.ok) return null;
                const data = await res.json();
                return data.settings;
            } catch {
                return null;
            }
        },
        retry: false,
    });

    useEffect(() => {
        if (serverSettings?.theme) {
            setTheme(serverSettings.theme as Theme);
        }
    }, [serverSettings]);

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

    const value = {
        theme,
        setTheme: (theme: Theme) => {
            localStorage.setItem(storageKey, theme);
            setTheme(theme);
        },
    };

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
