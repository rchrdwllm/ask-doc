import { db } from "@/db";
import { document, documentSelectSchema } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { headers } from "next/headers";
import * as z from "zod";
import { createSupabaseClient } from "@/lib/supabase";
import { randomUUID } from "crypto";
import { MAX_FILE_SIZE } from "@/constants";

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

      const result = await db
        .select()
        .from(document)
        .where(eq(document.userId, session.user.id));

      return status(200, result);
    },
    {
      response: {
        200: z.array(documentSelectSchema),
        401: z.object({
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

      const result = await db
        .insert(document)
        .values({
          id: docId,
          title: fileName.replace(/\.pdf$/i, ""),
          url: urlData.publicUrl,
          storage_path: data.path,
          status: "processing",
          userId: session.user.id,
        })
        .returning();

      return status(200, result[0]);
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

      const [result] = await db
        .select()
        .from(document)
        .where(eq(document.id, id));

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

      const [result] = await db
        .select()
        .from(document)
        .where(eq(document.id, id));

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

      const [deletedResult] = await db
        .delete(document)
        .where(eq(document.id, id))
        .returning();

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
      },
    },
  );
