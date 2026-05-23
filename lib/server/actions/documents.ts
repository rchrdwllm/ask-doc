"use server";

import { client } from "@/lib/api";
import { auth } from "@/lib/auth";
import { updateTag } from "next/cache";
import { headers } from "next/headers";

export const deleteDocument = async (documentId: string) => {
  const incoming = await headers();
  const cookieHeader = incoming.get("cookie") ?? "";
  const session = await auth.api.getSession({ headers: incoming });
  const { data, error } = await client
    .documents({ id: documentId })
    .delete({}, { headers: { cookie: cookieHeader } });

  if (session?.user?.id) {
    updateTag(`${session.user.id}:documents`);
    updateTag(`${session.user.id}:documents:${documentId}`);
    updateTag(`${session.user.id}:documents:${documentId}:conversations`);
  }

  return { data, error };
};
