import "dotenv/config";

type CheckStatus = "ok" | "warning" | "error";

type Check = {
  key: string;
  status: CheckStatus;
  message: string;
};

const checks: Check[] = [];

function addCheck(key: string, status: CheckStatus, message: string) {
  checks.push({ key, status, message });
}

function byteLength(value: string): number {
  return Buffer.byteLength(value, "utf8");
}

function isPlaceholder(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return [
    "change-this",
    "changeme",
    "your-super-secret",
    "your-32-byte",
    "replace-me",
    "redacted",
  ].some((placeholder) => normalized.includes(placeholder));
}

function validateDatabaseUrl() {
  const value = process.env.DATABASE_URL;
  if (!value) {
    addCheck("DATABASE_URL", "error", "DATABASE_URL is required.");
    return;
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    addCheck("DATABASE_URL", "error", "DATABASE_URL must be a valid Postgres connection string.");
    return;
  }

  if (!["postgres:", "postgresql:"].includes(parsed.protocol)) {
    addCheck("DATABASE_URL", "error", "DATABASE_URL must use postgres:// or postgresql://, not a public Supabase URL.");
    return;
  }

  if (!parsed.hostname) {
    addCheck("DATABASE_URL", "error", "DATABASE_URL must include a database host.");
    return;
  }

  if (parsed.password && isPlaceholder(parsed.password)) {
    addCheck("DATABASE_URL", "error", "DATABASE_URL contains a placeholder password.");
    return;
  }

  if (parsed.hostname.endsWith(".supabase.co") && !parsed.password) {
    addCheck("DATABASE_URL", "error", "Supabase DATABASE_URL must include a password.");
    return;
  }

  const isDirectSupabaseHost = parsed.hostname.startsWith("db.") && parsed.hostname.endsWith(".supabase.co");
  const isSupabasePooler = parsed.hostname.includes("pooler.supabase");

  addCheck(
    "DATABASE_URL",
    "ok",
    `Postgres URL detected for host=${parsed.hostname}, port=${parsed.port || "default"}, database=${parsed.pathname.replace("/", "") || "default"}.`,
  );

  if (isDirectSupabaseHost) {
    addCheck(
      "DATABASE_URL_CONNECTIVITY",
      "warning",
      "Direct Supabase db.* host may require IPv6 egress; use a Supabase pooler URL if the runtime is IPv4-only.",
    );
  }

  if (isSupabasePooler || parsed.port === "6543") {
    addCheck(
      "DATABASE_URL_POOLER",
      "ok",
      "Supabase pooler-like URL detected; runtime DB client disables prepared statements for pooler compatibility.",
    );
  }
}

function validateSecretLength(key: "JWT_SECRET" | "SESSION_SECRET", minLength: number) {
  const value = process.env[key];
  if (!value) {
    addCheck(key, "error", `${key} is required.`);
    return;
  }

  if (value.length < minLength) {
    addCheck(key, "error", `${key} must be at least ${minLength} characters.`);
    return;
  }

  if (isPlaceholder(value)) {
    addCheck(key, "error", `${key} must not use a documented placeholder value.`);
    return;
  }

  addCheck(key, "ok", `${key} is present and meets the minimum length requirement.`);
}

function validateEncryptionKey() {
  const value = process.env.ENCRYPTION_KEY;
  if (!value) {
    addCheck("ENCRYPTION_KEY", "error", "ENCRYPTION_KEY is required.");
    return;
  }

  if (isPlaceholder(value)) {
    addCheck("ENCRYPTION_KEY", "error", "ENCRYPTION_KEY must not use a documented placeholder value.");
    return;
  }

  if (value.length === 64 && /^[0-9a-fA-F]+$/.test(value)) {
    addCheck("ENCRYPTION_KEY", "ok", "ENCRYPTION_KEY is valid 32-byte hex.");
    return;
  }

  if (/^[A-Za-z0-9+/=]+$/.test(value)) {
    try {
      if (Buffer.from(value, "base64").length === 32) {
        addCheck("ENCRYPTION_KEY", "ok", "ENCRYPTION_KEY is valid 32-byte base64.");
        return;
      }
    } catch {
      // Fall through to direct byte-length validation.
    }
  }

  if (byteLength(value) === 32) {
    addCheck("ENCRYPTION_KEY", "ok", "ENCRYPTION_KEY is valid 32-byte utf8.");
    return;
  }

  addCheck("ENCRYPTION_KEY", "error", "ENCRYPTION_KEY must resolve to exactly 32 bytes.");
}

function validateBaseUrl() {
  const value = process.env.BASE_URL;
  if (!value) {
    addCheck("BASE_URL", "error", "BASE_URL is required.");
    return;
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    addCheck("BASE_URL", "error", "BASE_URL must be a valid absolute URL.");
    return;
  }

  if (process.env.NODE_ENV === "production" && parsed.protocol !== "https:") {
    addCheck("BASE_URL", "error", "BASE_URL must use https:// in production.");
    return;
  }

  addCheck("BASE_URL", "ok", `BASE_URL is valid for origin=${parsed.origin}.`);
}

validateDatabaseUrl();
validateSecretLength("JWT_SECRET", 32);
validateSecretLength("SESSION_SECRET", 32);
validateEncryptionKey();
validateBaseUrl();

const report = {
  generatedAt: new Date().toISOString(),
  nodeEnv: process.env.NODE_ENV || "development",
  summary: {
    errors: checks.filter((check) => check.status === "error").length,
    warnings: checks.filter((check) => check.status === "warning").length,
    ok: checks.filter((check) => check.status === "ok").length,
  },
  checks,
};

console.log("BACKEND_ENV_VALIDATION_START");
console.log(JSON.stringify(report, null, 2));
console.log("BACKEND_ENV_VALIDATION_END");

if (report.summary.errors > 0) {
  process.exit(1);
}
