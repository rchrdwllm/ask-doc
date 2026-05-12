import { documentChunk } from "@/db/schema";
import { getSimilarDocumentChunksByDocumentId } from "@/functions/document-chunks";
import { auth } from "@/lib/auth";
import { createQueryEmbedding } from "@/lib/embeddings";
import { Elysia } from "elysia";
import { headers } from "next/headers";
import * as z from "zod";

export const retrievalRouter = new Elysia({
  prefix: "/:id/retrieval",
}).get(
  "/",
  async ({ status, query, params }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return status(401, {
        error: "Unauthorized",
      });
    }

    const { q } = query;
    const { id } = params;

    const queryEmbedding = await createQueryEmbedding(q);

    const result = await getSimilarDocumentChunksByDocumentId(
      queryEmbedding,
      id,
    );

    return status(200, result);
  },
  {
    query: z.object({
      q: z.string(),
    }),
    params: z.object({
      id: z.string(),
    }),
    response: {
      200: z.array(z.custom<z.infer<typeof documentChunk>>()),
      401: z.object({
        error: z.string(),
      }),
    },
  },
);
