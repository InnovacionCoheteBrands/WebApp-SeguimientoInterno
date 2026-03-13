import { spawnSync } from "node:child_process";

const command = process.platform === "win32" ? "cmd" : "npm";
const args = process.platform === "win32"
  ? ["/c", "npm", "audit", "--omit=dev", "--json"]
  : ["audit", "--omit=dev", "--json"];

const result = spawnSync(command, args, {
  cwd: process.cwd(),
  encoding: "utf8",
  shell: false,
});

if (result.error) {
  console.error("[audit-check] Failed to execute npm audit.");
  console.error(result.error);
  process.exit(1);
}

const stdout = result.stdout?.trim() ?? "";
const stderr = result.stderr?.trim() ?? "";
const output = stdout || stderr;

if (!output) {
  console.error("[audit-check] npm audit did not return JSON output.");
  process.exit(1);
}

let report: any;
try {
  report = JSON.parse(output);
} catch (error) {
  console.error("[audit-check] Failed to parse npm audit JSON output.");
  console.error(error);
  console.error(output);
  process.exit(1);
}

const counts = report?.metadata?.vulnerabilities ?? {
  info: 0,
  low: 0,
  moderate: 0,
  high: 0,
  critical: 0,
  total: 0,
};

console.log(
  `[audit-check] Production vulnerabilities => low=${counts.low ?? 0}, moderate=${counts.moderate ?? 0}, high=${counts.high ?? 0}, critical=${counts.critical ?? 0}, total=${counts.total ?? 0}`,
);

if ((counts.high ?? 0) > 0 || (counts.critical ?? 0) > 0) {
  console.error("[audit-check] Deployment blocked: high or critical production vulnerabilities detected.");
  process.exit(1);
}

if (result.status && result.status !== 0) {
  console.warn("[audit-check] npm audit exited non-zero due to low/moderate issues, but no high/critical vulnerabilities remain.");
}

console.log("[audit-check] Passed: no high or critical production vulnerabilities detected.");
