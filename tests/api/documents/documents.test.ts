import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn().mockResolvedValue({
        user: { id: "user-id" },
      }),
    },
  },
}));

vi.mock("@/db", () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          where: vi
            .fn()
            .mockResolvedValue([
              { id: "document-id", conversationId: "conversation-id" },
            ]),
        }),
        where: vi
          .fn()
          .mockResolvedValue([{ id: "document-id", userId: "user-id" }]),
      }),
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockResolvedValue({
          id: "message-id",
          conversationId: "conversation-id",
          role: "user",
          content: "Hello",
        }),
      }),
    }),
  },
}));

vi.mock("@/lib/api", () => ({
  client: {
    documents: vi.fn().mockReturnValue({
      messages: {
        post: vi.fn().mockResolvedValue({
          status: 200,
          data: {
            id: "message-id",
            conversationId: "conversation-id",
            role: "user",
            content: "Hello",
          },
        }),
      },
    }),
  },
}));

import { client } from "@/lib/api";

describe("Messages Router", () => {
  it("should create a new message for a document", async () => {
    const res = await client.documents({ id: "document-id" }).messages.post({
      content: "Hello",
      id: "message-id",
    });

    expect(res.status).toBe(200);
    expect(res.data).toMatchObject({
      id: "message-id",
      conversationId: "conversation-id",
      role: "user",
      content: "Hello",
    });
  });
});
