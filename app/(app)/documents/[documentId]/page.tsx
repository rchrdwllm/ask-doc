import type { Metadata } from "next"
import { CalendarDays, Eye, List } from "lucide-react"
import Link from "next/link"
import { headers } from "next/headers"
import { client } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { DocumentConversationsEmptyClient } from "@/components/documents/document-conversations-empty-client"
import { NewConversationButton } from "@/components/documents/new-conversation-button"
import { ConversationCard } from "@/components/documents/conversation-card"
import DocumentViewerPanel from "@/components/documents/document-viewer/document-viewer-panel"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate, extractTextFromParts, sanitizePlainText, formatRelativeTime } from "@/lib/documents"
import { getDocumentById } from "@/lib/server/documents"
import { auth } from "@/lib/auth"
import { getDocumentConversations } from "@/lib/server/conversations"
import { getConversationLastMessage } from "@/lib/server/messages"
import { Suspense } from "react"

type DocumentPageProps = {
  params: Promise<{ documentId: string }>
  searchParams: Promise<{ view?: string }>
}

export async function generateMetadata({
  params,
}: DocumentPageProps): Promise<Metadata> {
  const { documentId } = await params
  const incoming = await headers()
  const cookieHeader = incoming.get("cookie") ?? ""
  const { data } = await client.documents({ id: documentId }).get({
    headers: {
      cookie: cookieHeader,
    },
  })

  return {
    title: data ? `${data.title} — My Documents` : "Document",
  }
}

async function DocumentPageSuspenseWrapper({ params, searchParams }: DocumentPageProps) {
  const { documentId } = await params
  const { view } = await searchParams
  const isViewingDocument = view === "true"
  const incoming = await headers()
  const cookieHeader = incoming.get("cookie") ?? ""
  const session = await auth.api.getSession({ headers: incoming });
  const { data, error } = await getDocumentById(documentId, cookieHeader, session!.user.id);
  const { data: conversations } = await getDocumentConversations(documentId, cookieHeader, session!.user.id);
  const conversationItems = conversations ?? []
  const now = new Date()

  const conversationPreviews = await Promise.all(
    conversationItems.map(async (conversation) => {
      const { data: lastMessage } = await getConversationLastMessage(
        conversation.id,
        cookieHeader,
        session!.user.id
      )

      return {
        conversation,
        lastMessage: lastMessage ?? null,
      }
    }),
  )

  if (!data) {
    return (
      <main className="p-8">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-3xl font-semibold">Documents</h1>
          <p className="text-muted-foreground">
            {error
              ? `Error loading documents: ${error.value.message}`
              : "Loading..."}
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="flex flex-col gap-6 p-8">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="font-heading text-3xl font-semibold">
                {data.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <CalendarDays />
                  Uploaded {formatDate(data.createdAt)}
                </span>
                <Separator orientation="vertical" className="h-4" />
                <span>{data.pageCount ?? "—"} pages</span>
                <Separator orientation="vertical" className="h-4" />
                <Badge
                  variant={
                    data.status === "ready"
                      ? "default"
                      : data.status === "processing"
                        ? "secondary"
                        : "destructive"
                  }
                >
                  {(data.status ?? "processing").charAt(0).toUpperCase() +
                    (data.status ?? "processing").slice(1)}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isViewingDocument ? (
                <Button asChild variant="outline">
                  <Link href={`/documents/${data.id}`}>
                    <List data-icon="inline-start" />
                    Conversations
                  </Link>
                </Button>
              ) : (
                <Button asChild variant="outline">
                  <Link href={`/documents/${data.id}?view=true`}>
                    <Eye data-icon="inline-start" />
                    View document
                  </Link>
                </Button>
              )}
              <NewConversationButton documentId={data.id} />
            </div>
          </div>
        </div>
      </div>

      {isViewingDocument ? (
        <div className="min-h-[320px] rounded-xl border bg-muted/30 p-2 sm:p-4">
          <DocumentViewerPanel documentId={data.id} />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {conversationPreviews.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {conversationPreviews.map(({ conversation, lastMessage }) => {
                const previewText = lastMessage?.parts?.length
                  ? sanitizePlainText(extractTextFromParts(lastMessage.parts))
                  : "No messages yet"
                const previewTime = lastMessage?.createdAt
                  ? formatRelativeTime(new Date(lastMessage.createdAt), now)
                  : "No messages yet"

                return (
                  <ConversationCard
                    key={conversation.id}
                    documentId={data.id}
                    conversationId={conversation.id}
                    title={conversation.title}
                    previewText={previewText}
                    previewTime={previewTime}
                  />
                )
              })}
            </div>
          ) : (
            <DocumentConversationsEmptyClient documentId={data.id} />
          )}
        </div>
      )}
    </main>
  )
}

function SkeletonLoader() {
  return (
    <main className="flex flex-col gap-6 p-8">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="font-heading text-3xl font-semibold">Document</h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <CalendarDays />
                  Uploaded —
                </span>
                <Separator orientation="vertical" className="h-4" />
                <span>— pages</span>
                <Separator orientation="vertical" className="h-4" />
                <Badge variant="secondary">Processing</Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-[130px]" />
              <Skeleton className="h-9 w-[150px]" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex h-full flex-col rounded-xl border"
          >
            <div className="space-y-2 p-6 pb-3">
              <div className="flex items-start justify-between gap-3">
                <Skeleton className="h-5 flex-1" />
                <Skeleton className="size-8 shrink-0 rounded-md" />
              </div>
            </div>
            <div className="flex items-center gap-2 p-6 pt-3 mt-auto">
              <Skeleton className="h-3 flex-1" />
              <div className="shrink-0 h-4 w-px bg-border" />
              <Skeleton className="h-3 w-16 shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}

export default async function DocumentPage({
  params,
  searchParams,
}: DocumentPageProps) {
  return (
    <Suspense fallback={<SkeletonLoader />}>
      <DocumentPageSuspenseWrapper params={params} searchParams={searchParams} />
    </Suspense>
  )
}