import { message } from "@/db/schema";
import { db } from "@/db";
import { desc, eq } from "drizzle-orm";
import { messageInsertSchema } from "@/db/schema";
import * as z from "zod";

export const createMessage = async (
  values: z.infer<typeof messageInsertSchema>,
) => {
  const result = await db.insert(message).values(values).returning();

  return result;
};

export const getMessagesByConversationId = async (conversationId: string) => {
  const result = await db
    .select()
    .from(message)
    .where(eq(message.conversationId, conversationId));

  return result;
};

export const getLastMessageByConversationId = async (
  conversationId: string,
) => {
  const result = await db
    .select()
    .from(message)
    .where(eq(message.conversationId, conversationId))
    .orderBy(desc(message.createdAt))
    .limit(1);

  return result;
};
