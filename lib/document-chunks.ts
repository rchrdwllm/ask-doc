import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export const chunkDocument = async (file: File) => {
  try {
    const loader = new WebPDFLoader(file, {
      pdfjs: async () => {
        const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist");

        GlobalWorkerOptions.workerSrc =
          "https://cdn.jsdelivr.net/npm/pdfjs-dist@5.7.284/build/pdf.worker.min.mjs";

        return { getDocument } as any;
      },
    });
    const docs = await loader.load();

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 50,
    });

    const chunks = await splitter.splitDocuments(docs);

    return { data: chunks, error: null };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Failed to chunk document. Please make sure the file has valid text content.",
    };
  }
};
