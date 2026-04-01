import { describe, it, expect } from "vitest";
import {
    getRegisteredTool,
    getLlmToolSchemas,
    authorizeAgentAction,
    safeParseToolArgs,
    validateRequiredFields,
} from "../agent-tool-registry";

// ---------------------------------------------------------------------------
// Tool Registry
// ---------------------------------------------------------------------------

describe("Agent Tool Registry", () => {
    it("should expose LLM schemas for all registered tools", () => {
        const schemas = getLlmToolSchemas();
        expect(schemas.length).toBeGreaterThan(0);
        for (const s of schemas) {
            expect(s.type).toBe("function");
            expect(s.function.name).toBeTruthy();
            expect(s.function.description).toBeTruthy();
        }
    });

    it("should return undefined for unknown tool", () => {
        expect(getRegisteredTool("nonexistent_tool")).toBeUndefined();
    });

    it("should have read policy for query tools", () => {
        const readTools = ["get_campaigns", "get_analytics", "get_team", "get_client_status",
            "get_resources", "get_database_stats", "get_leads", "get_leads_metrics",
            "get_projects", "get_transactions", "get_financial_summary"];

        for (const name of readTools) {
            const tool = getRegisteredTool(name);
            expect(tool, `Tool ${name} should exist`).toBeDefined();
            expect(tool!.policy.kind).toBe("read");
            expect(tool!.policy.requiresApproval).toBe(false);
        }
    });

    it("should require approval for all write tools", () => {
        const writeTools = [
            "create_campaign", "update_campaign", "delete_campaign",
            "create_client", "update_client", "delete_client",
            "create_team_member", "update_team_member", "delete_team_member",
            "create_lead", "update_lead", "delete_lead",
            "create_project", "update_project", "delete_project",
        ];

        for (const name of writeTools) {
            const tool = getRegisteredTool(name);
            expect(tool, `Tool ${name} should exist`).toBeDefined();
            expect(tool!.policy.kind).toBe("write");
            expect(tool!.policy.requiresApproval).toBe(true);
        }
    });

    it("should assign high risk to delete tools", () => {
        const deleteTools = [
            "delete_campaign", "delete_client", "delete_team_member",
            "delete_lead", "delete_project",
        ];

        for (const name of deleteTools) {
            const tool = getRegisteredTool(name);
            expect(tool!.policy.riskLevel).toBe("high");
        }
    });

    it("should generate human-readable descriptions", () => {
        const tool = getRegisteredTool("create_campaign");
        expect(tool).toBeDefined();
        const desc = tool!.describeAction({ name: "Black Friday", clientName: "Acme" });
        expect(desc).toContain("Black Friday");
        expect(desc).toContain("Acme");
    });
});

// ---------------------------------------------------------------------------
// Safe JSON Parsing
// ---------------------------------------------------------------------------

describe("safeParseToolArgs", () => {
    it("should parse valid JSON object", () => {
        const result = safeParseToolArgs('{"name":"test"}');
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.args.name).toBe("test");
        }
    });

    it("should reject invalid JSON", () => {
        const result = safeParseToolArgs("not json");
        expect(result.ok).toBe(false);
    });

    it("should reject JSON arrays", () => {
        const result = safeParseToolArgs("[1,2,3]");
        expect(result.ok).toBe(false);
    });

    it("should reject null", () => {
        const result = safeParseToolArgs("null");
        expect(result.ok).toBe(false);
    });

    it("should handle empty object", () => {
        const result = safeParseToolArgs("{}");
        expect(result.ok).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// Authorization
// ---------------------------------------------------------------------------

describe("authorizeAgentAction", () => {
    it("should deny if no user is provided", () => {
        const tool = getRegisteredTool("create_campaign")!;
        const result = authorizeAgentAction(undefined, tool);
        expect(result.allowed).toBe(false);
        expect(result.code).toBe("AUTH_REQUIRED");
    });

    it("should allow any authenticated user when allowedRoles is empty", () => {
        const tool = getRegisteredTool("get_campaigns")!;
        const result = authorizeAgentAction({ id: "1", username: "test", role: "viewer" }, tool);
        expect(result.allowed).toBe(true);
    });

    it("should allow when user role matches allowedRoles", () => {
        const tool = getRegisteredTool("create_campaign")!;
        expect(tool.policy.allowedRoles.length).toBe(0);
        const result = authorizeAgentAction({ id: "1", username: "admin", role: "admin" }, tool);
        expect(result.allowed).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

describe("validateRequiredFields", () => {
    it("should pass when all required fields are present", () => {
        const result = validateRequiredFields("create_campaign", {
            campaignCode: "C-001",
            name: "Test",
            clientName: "Acme",
            channel: "Meta",
            priority: "High",
            budget: 5000,
        });
        expect(result.allowed).toBe(true);
    });

    it("should fail when a required field is missing", () => {
        const result = validateRequiredFields("create_campaign", {
            campaignCode: "C-001",
            name: "Test",
        });
        expect(result.allowed).toBe(false);
        expect(result.code).toBe("MISSING_REQUIRED_FIELD");
    });

    it("should fail when a required field is empty string", () => {
        const result = validateRequiredFields("create_campaign", {
            campaignCode: "",
            name: "Test",
            clientName: "Acme",
            channel: "Meta",
            priority: "High",
            budget: 5000,
        });
        expect(result.allowed).toBe(false);
    });

    it("should pass for tools with no required fields", () => {
        const result = validateRequiredFields("get_campaigns", {});
        expect(result.allowed).toBe(true);
    });

    it("should fail for unknown tool", () => {
        const result = validateRequiredFields("nonexistent_tool", {});
        expect(result.allowed).toBe(false);
        expect(result.code).toBe("TOOL_NOT_FOUND");
    });
});
