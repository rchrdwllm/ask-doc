import { db } from "@/db";
import { documentChunk, documentChunkInsertSchema } from "@/db/schema";
import * as z from "zod";

export const createDocumentChunk = async (
  body: z.infer<typeof documentChunkInsertSchema>[],
) => {
  const result = await db.insert(documentChunk).values(body).returning();

  return result;
};
