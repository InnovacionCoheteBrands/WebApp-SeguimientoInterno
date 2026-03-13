import OpenAI, {
    APIConnectionError,
    APIConnectionTimeoutError,
    APIError,
    AuthenticationError,
    BadRequestError,
    InternalServerError,
    RateLimitError,
} from "openai";
import { logger } from "./logger";

export type AiProvider = "xai" | "openai";

export interface AiRuntimeConfig {
    enabled: boolean;
    available: boolean;
    provider: AiProvider;
    baseURL: string;
    apiKey: string;
    model: string;
    issues: string[];
}

export interface AiHealthStatus {
    enabled: boolean;
    available: boolean;
    configured: boolean;
    provider: AiProvider;
    baseURL: string;
    model: string;
    issues: string[];
}

export interface AiHttpErrorPayload {
    error: string;
    details: string;
    code: string;
    retryable: boolean;
    provider: AiProvider;
    model: string;
    requestId: string;
}

const XAI_BASE_URL = "https://api.x.ai/v1";
const OPENAI_BASE_URL = "https://api.openai.com/v1";
const XAI_DEFAULT_MODEL = "grok-4-1-fast-non-reasoning";
const OPENAI_DEFAULT_MODEL = "gpt-4o-mini";

const PLACEHOLDER_KEY_PATTERNS = [
    "placeholder",
    "replace-me",
    "your-api-key",
    "changeme",
    "example",
    "local-dev",
];

function normalizeProvider(value: string | undefined): AiProvider | undefined {
    const normalized = value?.trim().toLowerCase();
    if (!normalized) return undefined;
    if (normalized === "xai" || normalized === "grok") return "xai";
    if (normalized === "openai") return "openai";
    return undefined;
}

function inferProvider(baseURL: string | undefined, model: string | undefined): AiProvider {
    const normalizedBaseURL = (baseURL || "").toLowerCase();
    const normalizedModel = (model || "").toLowerCase();
    if (normalizedBaseURL.includes("x.ai") || normalizedModel.includes("grok")) {
        return "xai";
    }
    return "openai";
}

function isPlaceholderApiKey(apiKey: string): boolean {
    const normalized = apiKey.trim().toLowerCase();
    if (!normalized) return true;
    return PLACEHOLDER_KEY_PATTERNS.some((pattern) => normalized.includes(pattern));
}

function buildConfigIssues(config: {
    enabled: boolean;
    provider: AiProvider;
    baseURL: string;
    apiKey: string;
    model: string;
}): string[] {
    if (!config.enabled) return [];

    const issues: string[] = [];
    const normalizedBaseURL = config.baseURL.toLowerCase();
    const normalizedModel = config.model.toLowerCase();

    if (!config.baseURL.trim()) {
        issues.push("AI_BASE_URL is required when AI summaries are enabled.");
    }
    if (isPlaceholderApiKey(config.apiKey)) {
        issues.push("AI_API_KEY is missing or still using a placeholder value.");
    }
    if (!config.model.trim()) {
        issues.push("AI_MODEL is required when AI summaries are enabled.");
    }

    if (config.provider === "xai") {
        if (normalizedBaseURL.includes("openai.com")) {
            issues.push("The configured AI base URL points to OpenAI, but the selected provider is xAI / Grok.");
        }
        if (normalizedModel && !normalizedModel.includes("grok")) {
            issues.push("The configured AI model does not look like a Grok model for the selected xAI provider.");
        }
    }

    if (config.provider === "openai") {
        if (normalizedBaseURL.includes("x.ai")) {
            issues.push("The configured AI base URL points to xAI, but the selected provider is OpenAI.");
        }
        if (normalizedModel.includes("grok")) {
            issues.push("The configured AI model is a Grok model, but the selected provider is OpenAI.");
        }
    }

    return issues;
}

export function getAiRuntimeConfig(): AiRuntimeConfig {
    const envProvider =
        normalizeProvider(process.env.AI_PROVIDER) ||
        normalizeProvider(process.env.AI_INTEGRATIONS_PROVIDER);

    const baseURL =
        process.env.AI_BASE_URL ||
        process.env.AI_INTEGRATIONS_BASE_URL ||
        process.env.AI_INTEGRATIONS_OPENAI_BASE_URL ||
        "";

    const model =
        process.env.AI_MODEL ||
        process.env.AI_INTEGRATIONS_MODEL ||
        "";

    const provider = envProvider || inferProvider(baseURL, model);
    const resolvedBaseURL = baseURL || (provider === "xai" ? XAI_BASE_URL : OPENAI_BASE_URL);
    const resolvedModel = model || (provider === "xai" ? XAI_DEFAULT_MODEL : OPENAI_DEFAULT_MODEL);
    const apiKey =
        process.env.AI_API_KEY ||
        process.env.AI_INTEGRATIONS_API_KEY ||
        process.env.AI_INTEGRATIONS_OPENAI_API_KEY ||
        "";

    const enabled = process.env.AI_ENABLED?.toLowerCase() !== "false";
    const issues = buildConfigIssues({
        enabled,
        provider,
        baseURL: resolvedBaseURL,
        apiKey,
        model: resolvedModel,
    });

    return {
        enabled,
        available: enabled && issues.length === 0,
        provider,
        baseURL: resolvedBaseURL,
        apiKey,
        model: resolvedModel,
        issues,
    };
}

export function getAiHealthStatus(): AiHealthStatus {
    const config = getAiRuntimeConfig();
    return {
        enabled: config.enabled,
        available: config.available,
        configured: !isPlaceholderApiKey(config.apiKey),
        provider: config.provider,
        baseURL: config.baseURL,
        model: config.model,
        issues: config.issues,
    };
}

export function logAiConfigStatus(): void {
    const config = getAiRuntimeConfig();
    if (!config.enabled) {
        logger.info({ provider: config.provider }, "AI summaries are disabled by configuration");
        return;
    }

    if (!config.available) {
        logger.warn(
            {
                provider: config.provider,
                baseURL: config.baseURL,
                model: config.model,
                issues: config.issues,
            },
            "AI runtime configuration issues detected"
        );
        return;
    }

    logger.info(
        {
            provider: config.provider,
            baseURL: config.baseURL,
            model: config.model,
        },
        "AI runtime configuration loaded"
    );
}

export class AiConfigError extends Error {
    status: number;
    code: string;
    retryable: boolean;
    provider: AiProvider;
    model: string;

    constructor(message: string, config: AiRuntimeConfig) {
        const primaryIssue = config.issues[0] || "AI configuration is incomplete.";
        const lowerIssue = primaryIssue.toLowerCase();
        const status = lowerIssue.includes("api_key") || lowerIssue.includes("placeholder") ? 401 : 400;
        const code =
            status === 401
                ? "AI_AUTH_MISCONFIGURED"
                : lowerIssue.includes("base url") || lowerIssue.includes("model")
                    ? "AI_PROVIDER_MISMATCH"
                    : "AI_NOT_CONFIGURED";

        super(message);
        this.name = "AiConfigError";
        this.status = status;
        this.code = code;
        this.retryable = false;
        this.provider = config.provider;
        this.model = config.model;
    }
}

export function createAiClient(): { client: OpenAI; config: AiRuntimeConfig } {
    const config = getAiRuntimeConfig();

    if (!config.enabled) {
        throw new AiConfigError("AI summaries are disabled by configuration.", config);
    }

    if (!config.available) {
        throw new AiConfigError(config.issues.join(" "), config);
    }

    return {
        client: new OpenAI({
            baseURL: config.baseURL,
            apiKey: config.apiKey,
            timeout: 20_000,
        }),
        config,
    };
}

function sanitizeErrorMessage(message: string | undefined): string {
    if (!message) {
        return "The AI provider returned an unknown error.";
    }

    return message
        .replace(/sk-[A-Za-z0-9_-]+/g, "[redacted-api-key]")
        .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [redacted-token]");
}

export function mapAiError(error: unknown, requestId: string, configOverride?: Partial<AiRuntimeConfig>) {
    const config = { ...getAiRuntimeConfig(), ...configOverride };

    const basePayload = {
        provider: config.provider,
        model: config.model,
        requestId,
    };

    if (error instanceof AiConfigError) {
        return {
            status: error.status,
            body: {
                error: "AI configuration error",
                details:
                    error.code === "AI_AUTH_MISCONFIGURED"
                        ? "La configuracion de IA esta incompleta o la API key es invalida."
                        : "La configuracion del proveedor de IA no es valida para generar resumenes.",
                code: error.code,
                retryable: error.retryable,
                ...basePayload,
            } satisfies AiHttpErrorPayload,
        };
    }

    if (error instanceof AuthenticationError) {
        return {
            status: 401,
            body: {
                error: "AI authentication failed",
                details: "La API key configurada para IA es invalida o ya expiro.",
                code: "AI_AUTH_FAILED",
                retryable: false,
                ...basePayload,
            } satisfies AiHttpErrorPayload,
        };
    }

    if (error instanceof RateLimitError) {
        return {
            status: 429,
            body: {
                error: "AI rate limited",
                details: "El proveedor de IA rechazo temporalmente la solicitud por limite de uso.",
                code: "AI_RATE_LIMITED",
                retryable: true,
                ...basePayload,
            } satisfies AiHttpErrorPayload,
        };
    }

    if (error instanceof APIConnectionTimeoutError) {
        return {
            status: 504,
            body: {
                error: "AI request timed out",
                details: "El proveedor de IA tardo demasiado en responder.",
                code: "AI_TIMEOUT",
                retryable: true,
                ...basePayload,
            } satisfies AiHttpErrorPayload,
        };
    }

    if (error instanceof APIConnectionError) {
        return {
            status: 503,
            body: {
                error: "AI provider unavailable",
                details: "No fue posible conectar con el proveedor de IA en este momento.",
                code: "AI_PROVIDER_UNAVAILABLE",
                retryable: true,
                ...basePayload,
            } satisfies AiHttpErrorPayload,
        };
    }

    if (error instanceof BadRequestError) {
        return {
            status: 400,
            body: {
                error: "AI request rejected",
                details: "El proveedor de IA rechazo la solicitud. Verifica el modelo configurado y el tamano del payload.",
                code: "AI_BAD_REQUEST",
                retryable: false,
                ...basePayload,
            } satisfies AiHttpErrorPayload,
        };
    }

    if (error instanceof InternalServerError) {
        return {
            status: 503,
            body: {
                error: "AI provider error",
                details: "El proveedor de IA tuvo una falla interna al procesar el resumen.",
                code: "AI_UPSTREAM_ERROR",
                retryable: true,
                ...basePayload,
            } satisfies AiHttpErrorPayload,
        };
    }

    if (error instanceof APIError) {
        const retryable = (error.status ?? 500) >= 500;
        return {
            status: error.status ?? 500,
            body: {
                error: "AI request failed",
                details: sanitizeErrorMessage(error.message),
                code: "AI_API_ERROR",
                retryable,
                ...basePayload,
            } satisfies AiHttpErrorPayload,
        };
    }

    return {
        status: 500,
        body: {
            error: "Failed to generate summary",
            details: "Ocurrio un error inesperado al generar el resumen con IA.",
            code: "AI_UNKNOWN_ERROR",
            retryable: true,
            ...basePayload,
        } satisfies AiHttpErrorPayload,
    };
}
