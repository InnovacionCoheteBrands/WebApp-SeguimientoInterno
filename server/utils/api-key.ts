import crypto from "crypto";

export interface ApiKeySummary {
  present: boolean;
  masked: string | null;
  last4: string | null;
}

const API_KEY_PREFIX = "mc_live_";
const STORED_API_KEY_PREFIX = "sha256:";
const RAW_KEY_BYTES = 32;

export function generateApiKey(): string {
  const randomPart = crypto.randomBytes(RAW_KEY_BYTES).toString("base64url");
  return `${API_KEY_PREFIX}${randomPart}`;
}

export function getApiKeyLast4(rawApiKey: string): string {
  return rawApiKey.slice(-4);
}

export function hashApiKey(rawApiKey: string): string {
  return crypto.createHash("sha256").update(rawApiKey, "utf8").digest("hex");
}

export function toStoredApiKey(rawApiKey: string): string {
  return `${STORED_API_KEY_PREFIX}${hashApiKey(rawApiKey)}:${getApiKeyLast4(rawApiKey)}`;
}

export function isStoredHashedApiKey(value: string | null | undefined): boolean {
  if (!value) {
    return false;
  }
  return /^sha256:[a-f0-9]{64}:[A-Za-z0-9_-]{4}$/i.test(value);
}

export function createApiKeySummary(summarySource: string | null | undefined): ApiKeySummary {
  if (!summarySource || summarySource.trim().length === 0) {
    return {
      present: false,
      masked: null,
      last4: null,
    };
  }

  if (isStoredHashedApiKey(summarySource)) {
    const last4 = summarySource.split(":")[2];
    return {
      present: true,
      masked: `${API_KEY_PREFIX}...${last4}`,
      last4,
    };
  }

  const trimmed = summarySource.trim();
  const last4 = trimmed.slice(-4);
  const prefix = trimmed.startsWith(API_KEY_PREFIX) ? API_KEY_PREFIX : "legacy_";

  return {
    present: true,
    masked: `${prefix}...${last4}`,
    last4,
  };
}

export function createApiKeySummaryFromRaw(rawApiKey: string): ApiKeySummary {
  const last4 = getApiKeyLast4(rawApiKey);
  return {
    present: true,
    masked: `${API_KEY_PREFIX}...${last4}`,
    last4,
  };
}

// Future API-key auth note:
// Compare hash buffers with crypto.timingSafeEqual, never with "===".
