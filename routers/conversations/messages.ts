import { messageInsertSchema, messageSelectSchema } from "@/db/schema";
import { getConversationById } from "@/functions/conversations";
import {
  createMessage,
  getLastMessageByConversationId,
  getMessagesByConversationId,
} from "@/functions/messages";
import { auth } from "@/lib/auth";
import { Elysia } from "elysia";
import { headers } from "next/headers";
import * as z from "zod";

export const messagesRouter = new Elysia({
  prefix: "/:id/messages",
})
  .get(
    "/",
    async ({ status, params }) => {
      const { id } = params;

      const session = await auth.api.getSession({
        headers: await headers(),
      });

      if (!session) {
        return status(401, {
          message: "Unauthorized",
        });
      }

      const conversation = await getConversationById(id, session.user.id);

      if (!conversation) {
        return status(404, {
          message: "Conversation not found",
        });
      }

      const result = await getMessagesByConversationId(id);

      if (!result) {
        return status(500, {
          message: "Failed to retrieve messages for conversation",
        });
      }

      return status(200, result as z.infer<typeof messageSelectSchema>[]);
    },
    {
      params: z.object({
        id: z.string(),
      }),
      response: {
        200: messageSelectSchema.array(),
        401: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
        500: z.object({
          message: z.string(),
        }),
      },
    },
  )
  .post(
    "/",
    async ({ params, status, body }) => {
      const { id } = params;

      const session = await auth.api.getSession({
        headers: await headers(),
      });

      if (!session) {
        return status(401, {
          message: "Unauthorized",
        });
      }

      const conversation = await getConversationById(id, session.user.id);

      if (!conversation) {
        return status(404, {
          message: "Conversation not found",
        });
      }

      const [result] = await createMessage({
        ...body,
        conversationId: id,
        id: crypto.randomUUID(),
      });

      if (!result) {
        return status(500, {
          message: "Failed to create message",
        });
      }

      return status(200, result);
    },
    {
      body: messageInsertSchema,
    },
  )
  .get(
    "/last",
    async ({ params, status }) => {
      const { id } = params;

      const session = await auth.api.getSession({
        headers: await headers(),
      });

      if (!session) {
        return status(401, {
          message: "Unauthorized",
        });
      }

      const conversation = await getConversationById(id, session.user.id);

      if (!conversation) {
        return status(404, {
          message: "Conversation not found",
        });
      }

      const [result] = await getLastMessageByConversationId(id);

      if (!result) {
        return status(500, {
          message: "Failed to retrieve messages for conversation",
        });
      }

      return status(200, result as z.infer<typeof messageSelectSchema> | null);
    },
    {
      params: z.object({
        id: z.string(),
      }),
      response: {
        200: messageSelectSchema.nullable(),
        401: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
        500: z.object({
          message: z.string(),
        }),
      },
    },
  );
