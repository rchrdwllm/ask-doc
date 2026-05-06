import { describe, expect, it } from "vitest";
import { loginSchema } from "@/lib/schemas/auth";

describe("Authentication Schemas", () => {
  it("should accept a valid login payload", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "password123",
    });

    expect(result.success).toBe(true);
  });

  it("should reject an invalid login payload", () => {
    const result = loginSchema.safeParse({
      email: "invalid-email",
      password: "short",
    });

    expect(result.success).toBe(false);
  });
});
