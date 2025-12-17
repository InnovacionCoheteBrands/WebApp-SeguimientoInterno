
import { createContext, useContext, useEffect, useState } from "react";
import { useSystemSettings } from "@/hooks/use-system-settings";

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
        "cancel": "Cancel",
        "edit": "Edit",
        "delete": "Delete",
        "create": "Create",
        "new": "New",
        "search": "Search",
        "filter": "Filter",
        "status": "Status",
        "actions": "Actions",
        "view": "View",
        "back": "Back",
        "next": "Next",
        "previous": "Previous",
        "loading": "Loading...",
        "success": "Success",
        "error": "Error",
        "settings_description": "Application preferences and settings",
        "theme": "Theme",
        "language": "Language",
        "timezone": "Timezone",
        "notifications": "Notifications",
        "api_integrations": "API & Integrations",
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
        "cancel": "Cancelar",
        "edit": "Editar",
        "delete": "Eliminar",
        "create": "Crear",
        "new": "Nuevo",
        "search": "Buscar",
        "filter": "Filtrar",
        "status": "Estado",
        "actions": "Acciones",
        "view": "Ver",
        "back": "Atrás",
        "next": "Siguiente",
        "previous": "Anterior",
        "loading": "Cargando...",
        "success": "Éxito",
        "error": "Error",
        "settings_description": "Preferencias y configuración de la aplicación",
        "theme": "Tema",
        "language": "Idioma",
        "timezone": "Zona Horaria",
        "notifications": "Notificaciones",
        "api_integrations": "API e Integraciones",
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
        "cancel": "Annuler",
        "edit": "Modifier",
        "delete": "Supprimer",
        "create": "Créer",
        "new": "Nouveau",
        "search": "Rechercher",
        "filter": "Filtrer",
        "status": "Statut",
        "actions": "Actions",
        "view": "Voir",
        "back": "Retour",
        "next": "Suivant",
        "previous": "Précédent",
        "loading": "Chargement...",
        "success": "Succès",
        "error": "Erreur",
        "settings_description": "Préférences et paramètres de l'application",
        "theme": "Thème",
        "language": "Langue",
        "timezone": "Fuseau horaire",
        "notifications": "Notifications",
        "api_integrations": "API et Intégrations",
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
        "cancel": "Abbrechen",
        "edit": "Bearbeiten",
        "delete": "Löschen",
        "create": "Erstellen",
        "new": "Neu",
        "search": "Suchen",
        "filter": "Filtern",
        "status": "Status",
        "actions": "Aktionen",
        "view": "Ansicht",
        "back": "Zurück",
        "next": "Weiter",
        "previous": "Vorherige",
        "loading": "Laden...",
        "success": "Erfolg",
        "error": "Fehler",
        "settings_description": "Anwendungspräferenzen und Einstellungen",
        "theme": "Thema",
        "language": "Sprache",
        "timezone": "Zeitzone",
        "notifications": "Benachrichtigungen",
        "api_integrations": "API & Integrationen",
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
        "cancel": "キャンセル",
        "edit": "編集",
        "delete": "削除",
        "create": "作成",
        "new": "新規",
        "search": "検索",
        "filter": "フィルター",
        "status": "ステータス",
        "actions": "アクション",
        "view": "表示",
        "back": "戻る",
        "next": "次へ",
        "previous": "前へ",
        "loading": "読み込み中...",
        "success": "成功",
        "error": "エラー",
        "settings_description": "アプリケーションの設定",
        "theme": "テーマ",
        "language": "言語",
        "timezone": "タイムゾーン",
        "notifications": "通知",
        "api_integrations": "APIと統合",
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

    // Fetch settings from API (shared cache) to sync language
    const { data: settings } = useSystemSettings();

    useEffect(() => {
        if (settings?.language) {
            setLanguage(settings.language as Language);
        }
    }, [settings]);

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
