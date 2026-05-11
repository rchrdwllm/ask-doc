import { Elysia } from "elysia";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { messageInsertSchema } from "@/db/schema";
import {
  createMessage,
  getConversationIdByDocumentId,
} from "@/functions/messages";
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

    const conversationId = await getConversationIdByDocumentId(id);

    if (!conversationId) {
      return status(404, {
        error: "Document not found",
      });
    }

    const messageResult = await createMessage(conversationId, body);

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
