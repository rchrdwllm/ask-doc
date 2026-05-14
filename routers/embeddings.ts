import { Elysia } from "elysia";
import * as z from "zod";
import { embed, embedMany } from "ai";
import type { Document } from "@langchain/core/documents";
import { google } from "@ai-sdk/google";

export const embeddingsRouter = new Elysia({
  prefix: "/embeddings",
})
  .post(
    "/chunks",
    async ({ status, body }) => {
      const { chunks } = body;

      const embeddingModel = google.embeddingModel("gemini-embedding-001");
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
      const chunksWithEmbeddings = chunks.map((chunk, idx) => ({
        ...chunk,
        embedding: embeddings[idx],
      }));

      if (!chunksWithEmbeddings) {
        return status(500, {
          message: "Failed to create embeddings for chunks.",
        });
      }

      return status(200, chunksWithEmbeddings);
    },
    {
      body: z.object({
        chunks: z.array(z.custom<Document<Record<string, any>>>()),
      }),
      response: {
        200: z.array(
          z.object({
            pageContent: z.string(),
            metadata: z.record(z.string(), z.any()),
            embedding: z.array(z.number()),
          }),
        ),
        500: z.object({
          message: z.string(),
        }),
      },
    },
  )
  .post(
    "/query",
    async ({ status, body }) => {
      const { query } = body;

      const embeddingModel = google.embeddingModel("gemini-embedding-001");
      const { embedding } = await embed({
        model: embeddingModel,
        value: query,
        providerOptions: {
          google: {
            outputDimensionality: 768,
          },
        },
      });

      if (!embedding) {
        return status(500, {
          message: "Failed to create embedding for query.",
        });
      }

      return status(200, embedding);
    },
    {
      body: z.object({
        query: z.string(),
      }),
      response: {
        200: z.array(z.number()),
        500: z.object({
          message: z.string(),
        }),
      },
    },
  );
