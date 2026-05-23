"use server";

import { client } from "@/lib/api";
import { updateTag } from "next/cache";
import { headers } from "next/headers";

export const deleteDocument = async (documentId: string) => {
  const incoming = await headers();
  const cookie = incoming.get("cookie");
  const { data, error } = await client
    .documents({ id: documentId })
    .delete({}, { headers: { cookie } });

  updateTag(`documents:${cookie}`);

  return { data, error };
};
