import type { Request } from "express";

export interface OriginValidationResult {
  allowed: boolean;
  reason?: string;
}

interface ValidateOriginOptions {
  requireOrigin?: boolean;
}

function getAllowedOriginFromBaseUrl(): { origin?: string; reason?: string } {
  const baseUrl = process.env.BASE_URL;
  if (!baseUrl) {
    return { reason: "BASE_URL_NOT_CONFIGURED" };
  }

  try {
    return { origin: new URL(baseUrl).origin };
  } catch {
    return { reason: "BASE_URL_INVALID" };
  }
}

export function validateAuthOrigin(
  req: Request,
  options: ValidateOriginOptions = {},
): OriginValidationResult {
  if (process.env.NODE_ENV !== "production") {
    return { allowed: true };
  }

  const allowed = getAllowedOriginFromBaseUrl();
  if (!allowed.origin) {
    return { allowed: false, reason: allowed.reason };
  }

  const origin = req.headers.origin;
  if (!origin) {
    if (options.requireOrigin) {
      return { allowed: false, reason: "MISSING_ORIGIN" };
    }
    return { allowed: true };
  }

  if (origin !== allowed.origin) {
    return { allowed: false, reason: "INVALID_ORIGIN" };
  }

  return { allowed: true };
}
