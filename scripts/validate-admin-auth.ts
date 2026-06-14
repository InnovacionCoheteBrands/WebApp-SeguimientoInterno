import "dotenv/config";
import cookieParser from "cookie-parser";
import express from "express";
import request from "supertest";
import authRouter from "../server/controllers/auth";
import financialRouter from "../server/controllers/financial";
import projectsRouter from "../server/controllers/projects";
import { requireAuth } from "../server/middleware/auth";

const username = process.env.ADMIN_USERNAME?.trim();
const password = process.env.ADMIN_PASSWORD;

if (!username || !password) {
  throw new Error("ADMIN_USERNAME and ADMIN_PASSWORD are required.");
}

function requireCookie(response: request.Response): string {
  const setCookie = response.headers["set-cookie"];
  const cookies = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
  const refreshCookie = cookies.find((cookie) => cookie.startsWith("mc_refresh="));
  if (!refreshCookie) {
    throw new Error("Expected refresh cookie was not issued.");
  }
  return refreshCookie.split(";")[0];
}

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRouter);
app.use("/api", requireAuth, financialRouter);
app.use("/api", requireAuth, projectsRouter);

async function main() {
  const anonymousRegistration = await request(app)
    .post("/api/auth/register")
    .send({ username: "blocked_probe", password: "not-used-password" });
  if (anonymousRegistration.status !== 401) {
    throw new Error("Anonymous registration is not blocked.");
  }

  const login = await request(app)
    .post("/api/auth/login")
    .send({ username, password });
  if (login.status !== 200 || login.body?.user?.role !== "admin") {
    throw new Error(`Admin login failed with status ${login.status}.`);
  }
  if (login.body?.refreshToken) {
    throw new Error("Login exposed refreshToken in JSON.");
  }
  let refreshCookie = requireCookie(login);

  const session = await request(app)
    .get("/api/auth/session")
    .set("Cookie", [refreshCookie]);
  if (session.status !== 200 || session.body?.user?.role !== "admin") {
    throw new Error(`Session hydration failed with status ${session.status}.`);
  }
  if (session.body?.refreshToken) {
    throw new Error("Session exposed refreshToken in JSON.");
  }

  const refresh = await request(app)
    .post("/api/auth/refresh")
    .set("Cookie", [refreshCookie])
    .set("Content-Type", "application/json")
    .send({});
  if (refresh.status !== 200 || refresh.body?.user?.role !== "admin") {
    throw new Error(`Secure refresh failed with status ${refresh.status}.`);
  }
  if (refresh.body?.refreshToken) {
    throw new Error("Refresh exposed refreshToken in JSON.");
  }
  refreshCookie = requireCookie(refresh);

  const accessToken = refresh.body.token as string;
  const projectAnalytics = await request(app)
    .get("/api/projects/financial-analytics")
    .set("Authorization", `Bearer ${accessToken}`);
  if (projectAnalytics.status !== 200) {
    throw new Error(`Admin project analytics access failed with status ${projectAnalytics.status}.`);
  }

  const calendar = await request(app)
    .get("/api/finance/payment-calendar?startDate=2026-06-01&endDate=2026-06-30")
    .set("Authorization", `Bearer ${accessToken}`);
  if (calendar.status !== 200) {
    throw new Error(`Admin payment calendar access failed with status ${calendar.status}.`);
  }

  const anonymousFinancial = await request(app)
    .get("/api/projects/financial-analytics");
  if (anonymousFinancial.status !== 401) {
    throw new Error("Anonymous financial access was not blocked.");
  }

  const logout = await request(app)
    .post("/api/auth/logout")
    .set("Cookie", [refreshCookie])
    .set("Content-Type", "application/json")
    .send({});
  if (logout.status !== 204) {
    throw new Error(`Logout failed with status ${logout.status}.`);
  }

  console.log("[admin-auth-validation] Login, session, secure refresh, logout and admin read access passed.");
}

main().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error(
    "[admin-auth-validation] Validation failed:",
    error instanceof Error ? error.message : "Unknown error",
  );
  process.exit(1);
});
