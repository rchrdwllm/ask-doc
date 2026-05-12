import { messageInsertSchema, messageSelectSchema } from "@/db/schema";
import {
  createMessage,
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

      const result = await getMessagesByConversationId(id);

      return status(200, result);
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
  );
