import { CalendarDays, Eye, List, FileText } from "lucide-react"
import Link from "next/link"
import { headers } from "next/headers"
import { client } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { DocumentConversationsEmptyClient } from "@/components/documents/document-conversations-empty-client"
import { NewConversationButton } from "@/components/documents/new-conversation-button"
import { ConversationCard } from "@/components/documents/conversation-card"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { formatDate } from "@/lib/documents"

const MINUTE_SECONDS = 60
const HOUR_SECONDS = 60 * MINUTE_SECONDS
const DAY_SECONDS = 24 * HOUR_SECONDS
const WEEK_SECONDS = 7 * DAY_SECONDS
const MONTH_SECONDS = 30 * DAY_SECONDS
const YEAR_SECONDS = 365 * DAY_SECONDS

const sanitizePlainText = (value: string) => {
  return value
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^\)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^\)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/(^|\n)\s*#+\s+/g, "$1")
    .replace(/(^|\n)\s*>\s+/g, "$1")
    .replace(/(^|\n)\s*[-*+]\s+/g, "$1")
    .replace(/(^|\n)\s*\d+\.\s+/g, "$1")
    .replace(/[\*_~]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

const formatRelativeTime = (date: Date, now: Date) => {
  const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000)

  if (diffSeconds <= 0) return "just now"
  if (diffSeconds < MINUTE_SECONDS) return "just now"

  if (diffSeconds < HOUR_SECONDS) {
    const minutes = Math.round(diffSeconds / MINUTE_SECONDS)
    return `${minutes} min${minutes === 1 ? "" : "s"} ago`
  }

  if (diffSeconds < DAY_SECONDS) {
    const hours = Math.round(diffSeconds / HOUR_SECONDS)
    return `${hours} hr${hours === 1 ? "" : "s"} ago`
  }

  if (diffSeconds < WEEK_SECONDS) {
    const days = Math.round(diffSeconds / DAY_SECONDS)
    return `${days} day${days === 1 ? "" : "s"} ago`
  }

  if (diffSeconds < MONTH_SECONDS) {
    const weeks = Math.round(diffSeconds / WEEK_SECONDS)
    return `${weeks} wk${weeks === 1 ? "" : "s"} ago`
  }

  if (diffSeconds < YEAR_SECONDS) {
    const months = Math.round(diffSeconds / MONTH_SECONDS)
    return `${months} mo${months === 1 ? "" : "s"} ago`
  }

  const years = Math.round(diffSeconds / YEAR_SECONDS)
  return `${years} yr${years === 1 ? "" : "s"} ago`
}

type DocumentPageProps = {
  params: Promise<{ documentId: string }>
  searchParams: Promise<{ view?: string }>
}

export default async function DocumentPage({
  params,
  searchParams,
}: DocumentPageProps) {
  const { documentId } = await params
  const { view } = await searchParams
  const isViewingDocument = view === "true"
  const incoming = await headers()
  const cookieHeader = incoming.get("cookie") ?? ""
  const { data, error } = await client.documents({ id: documentId }).get({
    headers: {
      cookie: cookieHeader,
    },
  })
  const { data: conversations } = await client
    .documents({ id: documentId })
    .conversations.get({
      headers: {
        cookie: cookieHeader,
      },
    })
  const conversationItems = conversations ?? []
  const now = new Date()

  const conversationPreviews = await Promise.all(
    conversationItems.map(async (conversation) => {
      const { data: lastMessage } = await client
        .conversations({ id: conversation.id })
        .messages.last.get({
          headers: {
            cookie: cookieHeader,
          },
        })

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
        <Card>
          <CardHeader>
            <CardTitle>Document preview</CardTitle>
            <CardDescription>
              The full PDF viewer will appear here.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText />
              PDF source
            </div>
            <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-dashed bg-muted">
              <div className="flex max-w-sm flex-col items-center gap-2 text-center">
                <p className="font-medium">Document viewer coming soon</p>
                <p className="text-sm text-muted-foreground">
                  This stub will be replaced with the PDF renderer.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {conversationPreviews.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {conversationPreviews.map(({ conversation, lastMessage }) => {
                const previewText = lastMessage?.content
                  ? sanitizePlainText(lastMessage.content)
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
