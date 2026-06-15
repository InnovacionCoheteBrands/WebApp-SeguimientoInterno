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

  it("binds development servers to loopback unless explicitly opted in", () => {
    const bootstrapSource = readFileSync(
      path.resolve(process.cwd(), "server", "bootstrap.ts"),
      "utf8",
    );
    const viteConfigSource = readFileSync(
      path.resolve(process.cwd(), "vite.config.ts"),
      "utf8",
    );
    const viteMiddlewareSource = readFileSync(
      path.resolve(process.cwd(), "server", "vite.ts"),
      "utf8",
    );
    const websocketSource = readFileSync(
      path.resolve(process.cwd(), "server", "websocket.ts"),
      "utf8",
    );

    expect(bootstrapSource).toContain('process.env.DEV_HOST || "127.0.0.1"');
    expect(viteConfigSource).toContain('host: "127.0.0.1"');
    expect(viteConfigSource).toContain('allowedHosts: ["localhost"]');
    expect(viteMiddlewareSource).toContain("...viteConfig.server");
    expect(viteMiddlewareSource).toContain("clientPort: Number(process.env.PORT || 5000)");
    expect(viteMiddlewareSource).toContain('allowedHosts: ["localhost"]');
    expect(websocketSource).toContain('process.env.NODE_ENV === "development"');
    expect(websocketSource).toContain('pathname !== "/ws"');
    expect(viteConfigSource).not.toContain("allowedHosts: true");
    expect(viteMiddlewareSource).not.toContain("allowedHosts: true");
  });
});
