import { message } from "@/db/schema";
import { db } from "@/db";
import { eq } from "drizzle-orm";
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
