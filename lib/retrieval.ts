import {
  getSimilarDocumentChunks,
  getSimilarDocumentChunksByDocumentId,
} from "@/functions/document-chunks";
import { createQueryEmbedding } from "./embeddings";

export const retrieveInformation = async (
  query: string,
  documentId?: string,
) => {
  const queryEmbedding = await createQueryEmbedding(query);

  if (documentId) {
    return getSimilarDocumentChunksByDocumentId(queryEmbedding, documentId);
  } else {
    return getSimilarDocumentChunks(queryEmbedding);
  }
};
