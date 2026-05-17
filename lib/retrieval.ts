import {
  getSimilarDocumentChunks,
  getSimilarDocumentChunksByDocumentId,
} from "@/functions/document-chunks";

export const retrieveInformation = async (
  embedding: number[],
  documentId?: string,
) => {
  try {
    if (documentId) {
      return {
        data: await getSimilarDocumentChunksByDocumentId(embedding, documentId),
      };
    } else {
      return { data: await getSimilarDocumentChunks(embedding) };
    }
  } catch (error) {
    return { error };
  }
};
