import { db } from "@/db";
import { documentChunk, documentChunkInsertSchema } from "@/db/schema";
import {
  sql,
  cosineDistance,
  desc,
  gt,
  getTableColumns,
  and,
  eq,
} from "drizzle-orm";
import * as z from "zod";

export const createDocumentChunk = async (
  body: z.infer<typeof documentChunkInsertSchema>[],
) => {
  const result = await db.insert(documentChunk).values(body).returning();

  return result;
};

export const getSimilarDocumentChunksByDocumentId = async (
  embedding: number[],
  documentId: string,
) => {
  const similarity = sql<number>`1 - (${cosineDistance(documentChunk.embedding, embedding)})`;
  const documentChunkColumns = getTableColumns(documentChunk);

  const result = await db
    .select({ similarity, ...documentChunkColumns })
    .from(documentChunk)
    .where(and(gt(similarity, 0.8), eq(documentChunk.documentId, documentId)))
    .orderBy((t) => desc(t.similarity))
    .limit(5);

  return result;
};
