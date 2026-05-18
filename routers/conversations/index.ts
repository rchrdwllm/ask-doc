import { conversationSelectSchema } from "@/db/schema";
import {
  deleteConversationById,
  getConversationById,
} from "@/functions/conversations";
import { auth } from "@/lib/auth";
import { Elysia } from "elysia";
import { headers } from "next/headers";
import * as z from "zod";
import { messagesRouter } from "./messages";

export const conversationsRouter = new Elysia({
  prefix: "/conversations",
})
  .get(
    "/:id",
    async ({ status, params }) => {
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      if (!session) {
        return status(401, {
          message: "Unauthorized",
        });
      }

      const { id } = params;

      const [result] = await getConversationById(id, session.user.id);

      if (!result) {
        return status(404, {
          message: "Conversation not found",
        });
      }

      return status(200, result);
    },
    {
      response: {
        200: conversationSelectSchema,
        401: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      params: z.object({
        id: z.string(),
      }),
    },
  )
  .delete(
    "/:id",
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

      const [result] = await deleteConversationById(id, session.user.id);

      if (!result) {
        return status(404, {
          message: "Conversation not found",
        });
      }

      return status(200, result);
    },
    {
      response: {
        200: conversationSelectSchema,
        401: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      params: z.object({
        id: z.string(),
      }),
    },
  )
  .use(messagesRouter);
