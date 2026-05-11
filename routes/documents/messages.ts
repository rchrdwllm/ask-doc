import { Elysia } from "elysia";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import {
  conversation,
  document,
  message,
  messageInsertSchema,
} from "@/db/schema";
import * as z from "zod";

export const messagesRouter = new Elysia({
  prefix: "/:id/messages",
}).post(
  "/",
  async ({ status, params, body }) => {
    const { id } = params;

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return status(401, {
        error: "Unauthorized",
      });
    }

    const [documentResult] = await db
      .select({ id: document.id, conversationId: conversation.id })
      .from(document)
      .innerJoin(conversation, eq(document.id, conversation.documentId))
      .where(and(eq(document.id, id)));

    if (!documentResult) {
      return status(404, {
        error: "Document not found",
      });
    }

    const [messageResult] = await db.insert(message).values({
      ...body,
      conversationId: documentResult.conversationId,
      role: "user",
    });

    if (!messageResult) {
      return status(500, {
        error: "Failed to create message",
      });
    }

    return status(200, messageResult);
  },
  {
    response: {
      200: messageInsertSchema,
      400: z.object({
        error: z.string(),
      }),
      401: z.object({
        error: z.string(),
      }),
      404: z.object({
        error: z.string(),
      }),
      500: z.object({
        error: z.string(),
      }),
    },
    body: messageInsertSchema,
  },
);
