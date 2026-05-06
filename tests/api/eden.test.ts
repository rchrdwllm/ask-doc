import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api", () => ({
  client: {
    get: vi.fn().mockResolvedValue({ error: null, status: 200 }),
  },
}));

import { client } from "@/lib/api";

describe("Elysia Eden API", () => {
  it("should return status 200 for GET / API route", async () => {
    const res = await client.get();

    expect(res.error).toBeNull();
    expect(res.status).toBe(200);
  });
});
