
import { createContext, useContext, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

type Language = "en" | "es" | "fr" | "de" | "ja";

type LanguageProviderProps = {
    children: React.ReactNode;
    defaultLanguage?: Language;
    storageKey?: string;
};

type LanguageProviderState = {
    language: Language;
    setLanguage: (language: Language) => void;
    t: (key: string) => string;
};

const initialState: LanguageProviderState = {
    language: "en",
    setLanguage: () => null,
    t: (key) => key,
};

const LanguageProviderContext = createContext<LanguageProviderState>(initialState);

const translations: Record<Language, Record<string, string>> = {
    en: {
        "dashboard": "Dashboard",
        "clients": "Clients",
        "projects": "Projects",
        "resources": "Resources",
        "team": "Team",
        "analytics": "Analytics",
        "finance": "Finance",
        "settings": "Settings",
        "mission_control": "Mission Control",
        "system_configuration": "System Configuration",
        "save_changes": "Save Changes",
        // Add more as needed
    },
    es: {
        "dashboard": "Panel de Control",
        "clients": "Clientes",
        "projects": "Proyectos",
        "resources": "Recursos",
        "team": "Equipo",
        "analytics": "Analíticas",
        "finance": "Finanzas",
        "settings": "Configuración",
        "mission_control": "Centro de Mando",
        "system_configuration": "Configuración del Sistema",
        "save_changes": "Guardar Cambios",
    },
    fr: {
        "dashboard": "Tableau de Bord",
        "clients": "Clients",
        "projects": "Projets",
        "resources": "Ressources",
        "team": "Équipe",
        "analytics": "Analytique",
        "finance": "Finance",
        "settings": "Paramètres",
        "mission_control": "Contrôle de Mission",
        "system_configuration": "Configuration du Système",
        "save_changes": "Enregistrer les modifications",
    },
    de: {
        "dashboard": "Instrumententafel",
        "clients": "Kunden",
        "projects": "Projekte",
        "resources": "Ressourcen",
        "team": "Team",
        "analytics": "Analytik",
        "finance": "Finanzen",
        "settings": "Einstellungen",
        "mission_control": "Missionskontrolle",
        "system_configuration": "Systemkonfiguration",
        "save_changes": "Änderungen speichern",
    },
    ja: {
        "dashboard": "ダッシュボード",
        "clients": "クライアント",
        "projects": "プロジェクト",
        "resources": "リソース",
        "team": "チーム",
        "analytics": "分析",
        "finance": "財務",
        "settings": "設定",
        "mission_control": "ミッションコントロール",
        "system_configuration": "システム設定",
        "save_changes": "変更を保存",
    }
};

export function LanguageProvider({
    children,
    defaultLanguage = "en",
    storageKey = "app-language",
}: LanguageProviderProps) {
    const [language, setLanguage] = useState<Language>(() => {
        return (localStorage.getItem(storageKey) as Language) || defaultLanguage;
    });

    // Fetch settings from API to sync language
    const { data: serverSettings } = useQuery({
        queryKey: ["settings"],
        queryFn: async () => {
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
        if (serverSettings?.language) {
            setLanguage(serverSettings.language as Language);
        }
    }, [serverSettings]);

    useEffect(() => {
        localStorage.setItem(storageKey, language);
    }, [language, storageKey]);

    const value = {
        language,
        setLanguage: (lang: Language) => {
            setLanguage(lang);
        },
        t: (key: string) => {
            return translations[language]?.[key] || key;
        }
    };

    return (
        <LanguageProviderContext.Provider value={value}>
            {children}
        </LanguageProviderContext.Provider>
    );
}

export const useLanguage = () => {
    const context = useContext(LanguageProviderContext);

    if (context === undefined)
        throw new Error("useLanguage must be used within a LanguageProvider");

    return context;
};
