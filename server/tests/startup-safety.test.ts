import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("startup safety", () => {
  it("does not mutate refresh tokens during server bootstrap", () => {
    const bootstrapSource = readFileSync(
      path.resolve(process.cwd(), "server", "bootstrap.ts"),
      "utf8",
    );

    expect(bootstrapSource).not.toContain("revokeLegacyRefreshTokens");
  });

  it("keeps DB-writing websocket simulators behind an explicit opt-in flag", () => {
    const websocketSource = readFileSync(
      path.resolve(process.cwd(), "server", "websocket.ts"),
      "utf8",
    );

    expect(websocketSource).toContain('WEBSOCKET_SIMULATORS_ENABLED === "true"');
    expect(websocketSource.lastIndexOf("startTelemetrySimulator()")).toBeGreaterThan(
      websocketSource.indexOf('WEBSOCKET_SIMULATORS_ENABLED === "true"'),
    );
    expect(websocketSource.lastIndexOf("startMetricsSimulator()")).toBeGreaterThan(
      websocketSource.indexOf('WEBSOCKET_SIMULATORS_ENABLED === "true"'),
    );
  });
});
