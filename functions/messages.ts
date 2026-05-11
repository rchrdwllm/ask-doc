import { conversation, document, message } from "@/db/schema";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { messageInsertSchema } from "@/db/schema";
import * as z from "zod";

export const getConversationIdByDocumentId = async (documentId: string) => {
  const [result] = await db
    .select({ id: conversation.id })
    .from(conversation)
    .innerJoin(document, eq(document.id, conversation.documentId))
    .where(eq(document.id, documentId));

  return result?.id || null;
};

export const createMessage = async (
  conversationId: string,
  body: z.infer<typeof messageInsertSchema>,
) => {
  const [result] = await db
    .insert(message)
    .values({
      ...body,
      conversationId,
      role: "user",
    })
    .returning();

  return result;
};
