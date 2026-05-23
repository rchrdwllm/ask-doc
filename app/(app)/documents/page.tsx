import type { Metadata } from "next";
import DocumentsClient from "@/components/documents/documents-client";
import { client } from "@/lib/api";
import { headers } from "next/headers";

export const metadata: Metadata = {
  title: "My Documents",
};

export default async function DocumentsPage() {
  const incoming = await headers()
  const cookieHeader = incoming.get('cookie') ?? ''
  const { data, error } = await client.documents.get({
    fetch: {
      headers: {
        cookie: cookieHeader,
      },
    },
  });

  if (!data) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold">Documents</h1>
        <p className="mt-2 text-muted-foreground">
          {error ? `Error loading documents: ${error.value.message}` : "Loading..."}
        </p>
      </div>
    )
  }

  return (
    <DocumentsClient documents={data} />
  )
}