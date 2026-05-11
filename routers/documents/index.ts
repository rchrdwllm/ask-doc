import { documentSelectSchema } from "@/db/schema";
import { auth } from "@/lib/auth";
import { Elysia } from "elysia";
import { headers } from "next/headers";
import * as z from "zod";
import { createSupabaseClient } from "@/lib/supabase";
import { randomUUID } from "crypto";
import { MAX_FILE_SIZE } from "@/constants";
import { conversationsRouter } from "./conversations";
import { messagesRouter } from "./messages";
import {
  createDocument,
  deleteDocument,
  getAllUserDocuments,
  getDocumentById,
} from "@/functions/documents";
import { documentChunksRouter } from "./document-chunks";

export const documentsRouter = new Elysia({ prefix: "/documents" })
  .get(
    "/",
    async ({ status }) => {
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      if (!session) {
        return status(401, {
          message: "Unauthorized",
        });
      }

      const result = await getAllUserDocuments(session.user.id);

      if (!result) {
        return status(404, {
          message: "No documents found",
        });
      }

      return result;
    },
    {
      response: {
        200: z.array(documentSelectSchema),
        401: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
    },
  )
  .post(
    "/",
    async ({ body, status }) => {
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      if (!session) {
        return status(401, {
          message: "Unauthorized",
        });
      }

      const { file } = body;

      if (!file) {
        return status(400, {
          message: "No file provided",
        });
      }

      if (file.size > MAX_FILE_SIZE) {
        return status(400, {
          message: "File size exceeds 20MB limit",
        });
      }

      const docId = randomUUID();
      const fileName = file.name;
      const storagePath = `${session.user.id}/${docId}/${fileName}`;

      const supabase = createSupabaseClient();

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { data, error } = await supabase.storage
        .from("documents")
        .upload(storagePath, buffer, {
          contentType: file.type || "application/pdf",
          upsert: false,
        });

      if (error) {
        console.error("Supabase upload error:", error);

        return status(500, {
          message: "Failed to upload file",
        });
      }

      const { data: urlData } = supabase.storage
        .from("documents")
        .getPublicUrl(data.path);

      const result = await createDocument(
        session.user.id,
        fileName.replace(/\.pdf$/i, ""),
        urlData.publicUrl,
        data.path,
      );

      if (!result) {
        return status(500, {
          message: "Failed to create document record",
        });
      }

      return status(200, result);
    },
    {
      body: z.object({
        file: z.custom<File>(),
      }),
      response: {
        200: documentSelectSchema,
        400: z.object({
          message: z.string(),
        }),
        401: z.object({
          message: z.string(),
        }),
        500: z.object({
          message: z.string(),
        }),
      },
    },
  )
  .get(
    "/:id",
    async ({ params, status }) => {
      const { id } = params;

      const session = await auth.api.getSession({
        headers: await headers(),
      });

      if (!session) {
        return status(401, {
          message: "Unauthorized",
        });
      }

      const result = await getDocumentById(id);

      if (!result) {
        return status(404, {
          message: "Document not found",
        });
      }

      if (result.userId !== session.user.id) {
        return status(401, {
          message: "Unauthorized",
        });
      }

      return status(200, result);
    },
    {
      response: {
        200: documentSelectSchema,
        400: z.object({
          message: z.string(),
        }),
        401: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
    },
  )
  .delete(
    "/:id",
    async ({ params, status }) => {
      const { id } = params;

      const session = await auth.api.getSession({
        headers: await headers(),
      });

      if (!session) {
        return status(401, {
          message: "Unauthorized",
        });
      }

      const result = await getDocumentById(id);

      if (!result) {
        return status(404, {
          message: "Document not found",
        });
      }

      if (result.userId !== session.user.id) {
        return status(401, {
          message: "Unauthorized",
        });
      }

      const supabase = createSupabaseClient();

      const { error } = await supabase.storage
        .from("documents")
        .remove([result.storage_path]);

      if (error) {
        console.error("Supabase delete error:", error);

        return status(500, {
          message: "Failed to delete file",
        });
      }

      const deletedResult = await deleteDocument(id);

      return status(200, deletedResult);
    },
    {
      response: {
        200: documentSelectSchema,
        400: z.object({
          message: z.string(),
        }),
        401: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
        500: z.object({
          message: z.string(),
        }),
      },
    },
  )
  .use(conversationsRouter)
  .use(messagesRouter)
  .use(documentChunksRouter);
