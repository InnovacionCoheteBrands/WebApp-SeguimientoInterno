import { beforeEach, describe, expect, it, vi } from "vitest";
import { resolveExistingGoogleUser } from "../auth-google";
import { storage } from "../storage";

vi.mock("../storage", () => ({
  storage: {
    getUserByGoogleId: vi.fn(),
    getUserByUsername: vi.fn(),
    updateUser: vi.fn(),
  },
}));

describe("Google authentication provisioning", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns no user when the Google account was not provisioned", async () => {
    vi.mocked(storage.getUserByGoogleId).mockResolvedValue(undefined);
    vi.mocked(storage.getUserByUsername).mockResolvedValue(undefined);

    const user = await resolveExistingGoogleUser({
      id: "google-1",
      emails: [{ value: "new-user@example.com" }],
    });

    expect(user).toBeUndefined();
    expect(storage.updateUser).not.toHaveBeenCalled();
  });

  it("links Google identity only to an existing account", async () => {
    const existingUser = {
      id: "1",
      username: "existing@example.com",
      role: "user",
      googleId: null,
    };
    vi.mocked(storage.getUserByGoogleId).mockResolvedValue(undefined);
    vi.mocked(storage.getUserByUsername).mockResolvedValue(existingUser as any);
    vi.mocked(storage.updateUser).mockResolvedValue({
      ...existingUser,
      googleId: "google-1",
    } as any);

    const user = await resolveExistingGoogleUser({
      id: "google-1",
      emails: [{ value: "existing@example.com" }],
      photos: [{ value: "https://example.com/avatar.png" }],
    });

    expect(user).toBe(existingUser);
    expect(storage.updateUser).toHaveBeenCalledWith("1", {
      googleId: "google-1",
      avatarUrl: "https://example.com/avatar.png",
    });
  });
});
