import {
  conversation,
  conversationInsertSchema,
  conversationUpdateSchema,
} from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import * as z from "zod";

export const getConversationById = async (id: string, userId: string) => {
  const result = await db
    .select()
    .from(conversation)
    .where(and(eq(conversation.id, id), eq(conversation.userId, userId)));

  return result;
};

export const getConversationsByDocumentId = async (
  documentId: string,
  userId: string,
) => {
  const result = await db
    .select()
    .from(conversation)
    .where(
      and(
        eq(conversation.userId, userId),
        eq(conversation.documentId, documentId),
      ),
    )
    .orderBy(desc(conversation.updatedAt));

  return result;
};

export const createConversationForDocument = async (
  values: z.infer<typeof conversationInsertSchema>,
) => {
  const result = await db.insert(conversation).values(values).returning();

  return result;
};

export const deleteConversation = async (id: string, userId: string) => {
  const result = await db
    .delete(conversation)
    .where(and(eq(conversation.id, id), eq(conversation.userId, userId)))
    .returning();

  return result;
};

export const updateConversation = async (
  id: string,
  updates: z.infer<typeof conversationUpdateSchema>,
) => {
  const result = await db
    .update(conversation)
    .set(updates)
    .where(and(eq(conversation.id, id)))
    .returning();

  return result;
};
