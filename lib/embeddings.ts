import { embedMany, embed } from "ai";
import { Document } from "@langchain/core/documents";
import { google } from "@ai-sdk/google";

export const createChunkEmbeddings = async (
  chunks: Document<Record<string, any>>[],
) => {
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

  return chunksWithEmbeddings;
};

export const createQueryEmbedding = async (query: string) => {
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

  return embedding;
};
