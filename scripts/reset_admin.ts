import "dotenv/config";
import { storage } from "../server/storage";
import { hashPassword } from "../server/utils/crypto";

async function main() {
  const username = process.env.ADMIN_USERNAME?.trim();
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    throw new Error("ADMIN_USERNAME and ADMIN_PASSWORD are required.");
  }
  if (password.length < 12 || password.length > 100) {
    throw new Error("ADMIN_PASSWORD must be between 12 and 100 characters.");
  }

  const existingUser = await storage.getUserByUsername(username);
  if (!existingUser) {
    throw new Error("Admin user not found. No account was created.");
  }
  if (existingUser.role !== "admin") {
    throw new Error("Target user is not an administrator. No role was changed.");
  }

  const hashedPassword = await hashPassword(password);
  await storage.updateUserPassword(existingUser.id, hashedPassword);
  await storage.revokeAllUserRefreshTokens(existingUser.id);

  console.log(`[admin-reset] Password updated and existing sessions revoked for '${username}'.`);
  process.exit(0);
}

main().catch((error) => {
  console.error("[admin-reset] Reset failed:", error instanceof Error ? error.message : "Unknown error");
  process.exit(1);
});
