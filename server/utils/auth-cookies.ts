import type { CookieOptions } from "express";
import type { Request, Response } from "express";

const PROD_REFRESH_COOKIE_NAME = "__Host-mc_refresh";
const DEV_REFRESH_COOKIE_NAME = "mc_refresh";
const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

export function getRefreshCookieName(): string {
  return isProduction() ? PROD_REFRESH_COOKIE_NAME : DEV_REFRESH_COOKIE_NAME;
}

export function getRefreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax" as const,
    path: "/",
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
  };
}

export function getRefreshCookieClearOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax" as const,
    path: "/",
  };
}

export function getRefreshTokenFromCookie(req: Request): string | null {
  const rawValue = req.cookies?.[getRefreshCookieName()];
  if (typeof rawValue !== "string" || rawValue.length === 0) {
    return null;
  }
  return rawValue;
}

export function setRefreshTokenCookie(res: Response, refreshToken: string): void {
  res.cookie(getRefreshCookieName(), refreshToken, getRefreshCookieOptions());
}

export function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie(getRefreshCookieName(), getRefreshCookieClearOptions());
}
