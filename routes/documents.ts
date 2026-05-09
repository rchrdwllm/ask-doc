import { db } from "@/db";
import { document, documentSelectSchema } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { headers } from "next/headers";
import * as z from "zod";
import { createSupabaseClient } from "@/lib/supabase";
import { randomUUID } from "crypto";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export const documentsRouter = new Elysia({ prefix: "documents" })
  .get(
    "/",
    async () => {
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      if (!session) {
        throw Error("No user session found");
      }

      const result = await db
        .select()
        .from(document)
        .where(eq(document.userId, session.user.id));

      return {
        success: true,
        data: result,
      };
    },
    {
      response: z.object({
        success: z.boolean(),
        data: z.array(documentSelectSchema),
      }),
    },
  )
  .post(
    "/",
    async ({ body }) => {
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      if (!session) {
        throw Error("No user session found");
      }

      const { file } = body;

      if (!file) {
        throw new Error("No file provided");
      }

      if (file.size > MAX_FILE_SIZE) {
        throw new Error("File size exceeds 20MB limit");
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
        throw new Error("Failed to upload file");
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

      return {
        success: true,
        data: result[0],
      };
    },
    {
      body: z.object({
        file: z.custom<File>(),
      }),
      response: z.object({
        success: z.boolean(),
        data: documentSelectSchema,
      }),
    },
  )
  .get(
    "/:id",
    async ({ params }: { params: { id: string } }) => {
      const { id } = params;

      const result = await db
        .select()
        .from(document)
        .where(eq(document.id, id));

      return {
        success: true,
        data: result[0],
      };
    },
    {
      response: z.object({
        success: z.boolean(),
        data: documentSelectSchema.nullable(),
      }),
    },
  )
  .delete(
    "/:id",
    async ({ params }: { params: { id: string } }) => {
      const { id } = params;

      const result = await db
        .delete(document)
        .where(eq(document.id, id))
        .returning();

      return {
        success: true,
        data: result[0],
      };
    },
    {
      response: z.object({
        success: z.boolean(),
        data: documentSelectSchema.nullable(),
      }),
    },
  );
