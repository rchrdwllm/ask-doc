import { conversation } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";

export const getConversationByDocumentId = async (
  documentId: string,
  userId: string,
) => {
  const [result] = await db
    .select()
    .from(conversation)
    .where(
      and(
        eq(conversation.userId, userId),
        eq(conversation.documentId, documentId),
      ),
    );

  return result || null;
};