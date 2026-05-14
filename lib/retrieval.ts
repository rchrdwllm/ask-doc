import {
  getSimilarDocumentChunks,
  getSimilarDocumentChunksByDocumentId,
} from "@/functions/document-chunks";

export const retrieveInformation = async (
  embedding: number[],
  documentId?: string,
) => {
  if (documentId) {
    return getSimilarDocumentChunksByDocumentId(embedding, documentId);
  } else {
    return getSimilarDocumentChunks(embedding);
  }
};
