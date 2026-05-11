import { documentChunkInsertSchema } from "@/db/schema";
import { createDocumentChunk } from "@/functions/document-chunks";
import { getDocumentById } from "@/functions/documents";
import { Elysia } from "elysia";

export const documentChunksRouter = new Elysia({ prefix: "/:id/chunks" }).post(
  "/",
  async ({ status, params, body }) => {
    const { id } = params;

    const document = await getDocumentById(id);

    if (!document) {
      return status(404, {
        message: "Document not found",
      });
    }

    const result = await createDocumentChunk(body);

    if (!result) {
      return status(500, {
        message: "Failed to create document chunks",
      });
    }

    return result;
  },
  {
    body: documentChunkInsertSchema.array(),
  },
);
