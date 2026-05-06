import { describe, expect, it, vi } from "vitest";

vi.mock("better-auth/react", () => {
  return {
    createAuthClient: () => ({
      signIn: {
        email: vi.fn().mockResolvedValue({ error: null }),
        social: vi.fn().mockResolvedValue({ error: null }),
      },
    }),
  };
});

import { authClient } from "@/lib/auth-client";

describe("Authentication Flows", () => {
  it("should proceed with email/password login flow", async () => {
    const email = "test@gmail.com";
    const password = "password123";

    const { error } = await authClient.signIn.email({ email, password });

    expect(error).toBe(null);
  });

  it("should proceed with Google login flow", async () => {
    const { error } = await authClient.signIn.social({
      provider: "google",
    });

    expect(error).toBe(null);
  });
});
