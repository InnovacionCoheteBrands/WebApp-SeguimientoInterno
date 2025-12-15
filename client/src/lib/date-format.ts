/**
 * Date/Time formatting utilities that respect user settings (timezone + language)
 */

import type { NormalizedSystemSettings } from "./system-settings";

// Mapping from our language codes to Intl locale codes
const LOCALE_MAP: Record<string, string> = {
  en: "en-US",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
  ja: "ja-JP",
};

/**
 * Format a date with user's timezone and language preferences
 */
export function formatDate(
  date: Date | string | number,
  settings?: NormalizedSystemSettings | null,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const dateObj = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  
  const locale = settings?.language ? LOCALE_MAP[settings.language] || "en-US" : "en-US";
  const timeZone = settings?.timezone && settings.timezone !== "UTC" ? settings.timezone : undefined;

  return dateObj.toLocaleString(locale, {
    ...options,
    timeZone,
  });
}

/**
 * Format a date as a short date (no time)
 */
export function formatDateShort(
  date: Date | string | number,
  settings?: NormalizedSystemSettings | null
): string {
  return formatDate(date, settings, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format a date with time
 */
export function formatDateTime(
  date: Date | string | number,
  settings?: NormalizedSystemSettings | null
): string {
  return formatDate(date, settings, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format only the time portion
 */
export function formatTime(
  date: Date | string | number,
  settings?: NormalizedSystemSettings | null
): string {
  return formatDate(date, settings, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format month name (used in Calendar and charts)
 */
export function formatMonth(
  date: Date | string | number,
  settings?: NormalizedSystemSettings | null,
  format: "short" | "long" = "short"
): string {
  const dateObj = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  const locale = settings?.language ? LOCALE_MAP[settings.language] || "en-US" : "en-US";
  const timeZone = settings?.timezone && settings.timezone !== "UTC" ? settings.timezone : undefined;

  return dateObj.toLocaleString(locale, {
    month: format,
    timeZone,
  });
}

/**
 * Format a number as currency (respects locale for number formatting)
 */
export function formatCurrencyWithLocale(
  amount: number,
  currency: string = "USD",
  settings?: NormalizedSystemSettings | null
): string {
  const locale = settings?.language ? LOCALE_MAP[settings.language] || "en-US" : "en-US";
  
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount);
}

