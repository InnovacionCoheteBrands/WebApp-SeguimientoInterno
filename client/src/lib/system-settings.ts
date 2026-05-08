export type ThemeSetting = "dark" | "light" | "system" | "auto";
export type LanguageSetting = "en" | "es" | "fr" | "de" | "ja";

export interface SystemSettingsValues {
  // System
  theme: ThemeSetting;
  language: LanguageSetting;
  timezone: string;

  // Notifications
  campaignAlerts: boolean;
  analyticsAlerts: boolean;
  systemAlerts: boolean;
  emailNotifications: boolean;

  // Visualization
  refreshRate: string; // seconds as string
  chartAnimations: boolean;
}

export interface ApiKeySummary {
  present: boolean;
  masked: string | null;
  last4: string | null;
}

export interface SystemSettingsResponse {
  settings: Partial<SystemSettingsValues> | null | undefined;
  apiKey?: ApiKeySummary | string | null;
  webhookUrl?: string | null;
  username?: string;
  role?: string;
}

export interface NormalizedSystemSettings extends SystemSettingsValues {
  apiKey: ApiKeySummary;
  webhookUrl: string;
}

export const NO_API_KEY_SUMMARY: ApiKeySummary = {
  present: false,
  masked: null,
  last4: null,
};

function normalizeApiKeySummary(value: SystemSettingsResponse["apiKey"]): ApiKeySummary {
  if (!value) {
    return NO_API_KEY_SUMMARY;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return NO_API_KEY_SUMMARY;
    }

    const last4 = trimmed.slice(-4);
    return {
      present: true,
      masked: `legacy_...${last4}`,
      last4,
    };
  }

  if (!value.present) {
    return NO_API_KEY_SUMMARY;
  }

  return {
    present: true,
    masked: value.masked ?? null,
    last4: value.last4 ?? null,
  };
}

export const DEFAULT_SYSTEM_SETTINGS: SystemSettingsValues = {
  theme: "dark",
  language: "en",
  timezone: "UTC",
  campaignAlerts: true,
  analyticsAlerts: true,
  systemAlerts: true,
  emailNotifications: false,
  refreshRate: "5",
  chartAnimations: true,
};

export function normalizeTheme(theme: ThemeSetting | undefined | null): "dark" | "light" | "system" {
  if (theme === "auto") return "system";
  if (theme === "dark" || theme === "light" || theme === "system") return theme;
  return "dark";
}

export function normalizeLanguage(language: LanguageSetting | undefined | null): LanguageSetting {
  if (language === "en" || language === "es" || language === "fr" || language === "de" || language === "ja") {
    return language;
  }
  return "en";
}

export function normalizeSystemSettings(resp: SystemSettingsResponse | null | undefined): NormalizedSystemSettings {
  const raw = (resp?.settings ?? {}) as Partial<SystemSettingsValues>;

  return {
    ...DEFAULT_SYSTEM_SETTINGS,
    ...raw,
    theme: normalizeTheme(raw.theme),
    language: normalizeLanguage(raw.language),
    apiKey: normalizeApiKeySummary(resp?.apiKey),
    webhookUrl: resp?.webhookUrl ?? "",
  };
}

export function parseRefreshRateSeconds(refreshRate: string | undefined | null): number {
  const n = Number(refreshRate);
  if (!Number.isFinite(n)) return 5;
  return Math.max(1, Math.min(60, Math.floor(n)));
}


