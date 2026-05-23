import type { Metadata } from "next";
import DocumentsClient from "@/components/documents/documents-client";
import { headers } from "next/headers";
import { getDocuments } from "@/lib/server/documents";
import { Suspense } from "react";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "My Documents",
};

async function DocumentsPageSuspenseContent() {
  const incoming = await headers()
  const cookieHeader = incoming.get('cookie') ?? ''
  const session = await auth.api.getSession({ headers: incoming });
  const { data, error } = await getDocuments(cookieHeader, session!.user.id);

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

export default async function DocumentsPage() {
  return (
    <Suspense fallback={
      <div className="p-4">
        <h1 className="text-2xl font-bold">Documents</h1>
      </div>
    }>
      <DocumentsPageSuspenseContent />
    </Suspense>
  )
}