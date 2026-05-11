import { embedMany } from "ai";
import { Elysia } from "elysia";
import * as z from "zod";
import { Document } from "@langchain/core/documents";
import { google } from "@ai-sdk/google";

const documentSchema = z.object({
  pageContent: z.string(),
  metadata: z.record(z.string(), z.any()),
  id: z.string().optional(),
});

const embeddingsRequestSchema = z.object({
  chunks: z.array(documentSchema),
});

const embeddingsResponseSchema = z.array(
  documentSchema.extend({
    embedding: z.array(z.number()),
  }),
);

export const embeddingsRouter = new Elysia({ prefix: "/embeddings" }).post(
  "/",
  async ({ status, body }) => {
    const embeddingModel = google.embeddingModel("gemini-embedding-001");
    const { chunks } = embeddingsRequestSchema.parse(body) as {
      chunks: Document<Record<string, any>>[];
    };
    const mappedChunks = chunks.map((chunk) => chunk.pageContent);
    const { embeddings } = await embedMany({
      model: embeddingModel,
      values: mappedChunks,
      providerOptions: {
        google: {
          outputDimensionality: 768,
        },
      },
    });
    const result = chunks.map((chunk, idx) => ({
      ...chunk,
      embedding: embeddings[idx],
    }));

    return status(200, result);
  },
  {
    body: embeddingsRequestSchema,
    response: {
      200: embeddingsResponseSchema,
    },
  },
);
