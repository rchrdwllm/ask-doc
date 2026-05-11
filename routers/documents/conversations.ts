import { conversationSelectSchema } from "@/db/schema";
import { auth } from "@/lib/auth";
import { getConversationByDocumentId } from "@/functions/conversations";
import { Elysia } from "elysia";
import { headers } from "next/headers";
import * as z from "zod";

export const conversationsRouter = new Elysia({
  prefix: "/:id/conversations",
}).get(
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

    const result = await getConversationByDocumentId(id, session.user.id);

    if (!result)
      return status(404, {
        message: "Conversation not found for document",
      });

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
);
