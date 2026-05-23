import type { Metadata } from "next";
import DocumentsClient from "@/components/documents/documents-client";
import { headers } from "next/headers";
import { getDocuments } from "@/lib/server/documents";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";

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

function SkeletonLoader() {
  const rows = Array.from({ length: 5 })

  return (
    <main className="flex flex-col gap-6 p-8">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-3xl font-semibold">Documents</h1>
        </div>
        <p className="text-muted-foreground">
          Manage your uploaded documents for AI-powered Q&amp;A
        </p>
      </div>

      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      <div className="relative w-full overflow-x-auto">
        <table className="w-full caption-bottom text-sm">
          <thead className="[&_tr]:border-b">
            <tr className="border-b">
              <th className="h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground">
                <Skeleton className="h-4 w-24" />
              </th>
              <th className="h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground">
                <Skeleton className="h-4 w-16" />
              </th>
              <th className="h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground">
                <Skeleton className="h-4 w-14" />
              </th>
              <th className="h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground">
                <Skeleton className="h-4 w-20" />
              </th>
              <th className="h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground">
                <Skeleton className="h-4 w-10" />
              </th>
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {rows.map((_, index) => (
              <tr key={`skeleton-row-${index}`} className="border-b">
                <td className="p-2 align-middle whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-9 rounded-lg" />
                    <div className="flex flex-col gap-1">
                      <Skeleton className="h-4 w-44" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                </td>
                <td className="p-2 align-middle whitespace-nowrap">
                  <Skeleton className="h-5 w-20 rounded-full" />
                </td>
                <td className="p-2 align-middle whitespace-nowrap">
                  <Skeleton className="h-4 w-10" />
                </td>
                <td className="p-2 align-middle whitespace-nowrap">
                  <Skeleton className="h-4 w-24" />
                </td>
                <td className="p-2 align-middle whitespace-nowrap">
                  <Skeleton className="size-8 rounded-md" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}

export default async function DocumentsPage() {
  return (
    <Suspense fallback={<SkeletonLoader />}>
      <DocumentsPageSuspenseContent />
    </Suspense>
  )
}