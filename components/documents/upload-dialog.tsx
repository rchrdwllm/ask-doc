"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileIcon, UploadCloud, XIcon, Loader2Icon } from "lucide-react";
import { client } from "@/lib/api";
import { chunkDocument } from "@/lib/document-chunks";
import { documentChunkInsertSchema } from "@/db/schema";
import * as z from 'zod';
import { MAX_FILE_SIZE } from "@/constants";
import { toast } from "sonner";

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadDialog({ open, onOpenChange }: UploadDialogProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];

    if (selectedFile) {
      const isPdfType = selectedFile.type === "application/pdf";
      const isPdfExtension = selectedFile.name.toLowerCase().endsWith(".pdf");

      if (!isPdfType && !isPdfExtension) {
        setError("Please select a PDF file");
        return;
      }

      if (selectedFile.size > MAX_FILE_SIZE) {
        setError("File size exceeds 20MB limit");
        return;
      }

      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const { data, error: documentError } = await client.documents.post({ file });

      if (documentError) {
        setError(documentError.value.message || "Upload failed");

        return;
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("askdoc:documents-updated"));
      }

      router.refresh();

      onOpenChange(false);

      const { data: chunkData, error: chunkError } = await chunkDocument(file);

      if (chunkError) {
        setError(chunkError);
        setFile(null)

        await client.documents({ id: data.id }).patch({ status: "error" });

        toast.error(chunkError);
        router.refresh();

        return;
      } else if (!chunkData) {
        setError("Failed to chunk document. Please make sure the file has valid text content.");
        setFile(null)

        await client.documents({ id: data.id }).patch({ status: "error" });

        toast.error("Failed to chunk document. Please make sure the file has valid text content.");
        router.refresh()

        return;
      }

      await client.documents({ id: data.id }).patch({ pageCount: chunkData.pages });

      const { data: chunksWithEmbeddings, error: embeddingError } = await client.embeddings.chunks.post({ chunks: chunkData.chunks });

      if (embeddingError || !chunksWithEmbeddings) {
        setError(embeddingError.value.message || "Failed to create embeddings for chunks");
        setFile(null)

        await client.documents({ id: data.id }).patch({ status: "error" });

        toast.error(embeddingError.value.message || "Failed to create embeddings for chunks");
        router.refresh();

        return;
      }

      const chunksInsertMap: z.infer<typeof documentChunkInsertSchema>[] = chunksWithEmbeddings.map((chunk, idx) => ({
        id: crypto.randomUUID(),
        chunkIndex: idx,
        content: chunk.pageContent,
        pageNumbers: Array.isArray(chunk.metadata.loc.pageNumber) ? chunk.metadata.loc.pageNumber.map(Number) : [Number(chunk.metadata.loc.pageNumber)],
        lineFrom: chunk.metadata.loc.lines.from,
        lineTo: chunk.metadata.loc.lines.to,
        documentId: data.id,
        embedding: chunk.embedding,
      }));

      const { error: chunksError } = await client.documents({ id: data.id }).chunks.post(chunksInsertMap);

      if (chunksError) {
        setError(chunksError.value.message || "Failed to create document chunks");

        return;
      }

      const { error: updateError } = await client.documents({ id: data.id }).patch({ status: "ready" });

      if (updateError) {
        setError(updateError.value.message || "Failed to update document status");
        return;
      }

      setFile(null);
      onOpenChange(false);

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setFile(null);
      setError(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload a PDF file to chat with. Max file size is 20MB.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!file ? (
            <div
              className="relative flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border p-8 transition-colors hover:bg-muted/50"
              onClick={() => inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={handleFileChange}
                disabled={isUploading}
              />
              <UploadCloud className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Click to select a PDF file
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <FileIcon className="h-8 w-8 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setFile(null)}
                disabled={isUploading}
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
