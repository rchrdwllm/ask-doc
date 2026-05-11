import { document, documentUpdateSchema } from "@/db/schema";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as z from "zod";

export const getAllUserDocuments = async (userId: string) => {
  const result = await db
    .select()
    .from(document)
    .where(eq(document.userId, userId));

  return result;
};

export const createDocument = async (
  userId: string,
  title: string,
  url: string,
  storage_path: string,
) => {
  const id = crypto.randomUUID();
  const [result] = await db
    .insert(document)
    .values({
      id,
      title,
      url,
      storage_path,
      status: "processing",
      userId,
    })
    .returning();

  return result;
};

export const getDocumentById = async (id: string) => {
  const [result] = await db.select().from(document).where(eq(document.id, id));

  return result || null;
};

export const deleteDocument = async (id: string) => {
  const [result] = await db
    .delete(document)
    .where(eq(document.id, id))
    .returning();

  return result;
};

export const updateDocument = async (
  id: string,
  updates: z.infer<typeof documentUpdateSchema>,
) => {
  const [result] = await db
    .update(document)
    .set(updates)
    .where(eq(document.id, id))
    .returning();

  return result;
};
