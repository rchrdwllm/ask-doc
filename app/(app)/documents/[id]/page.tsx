import { CalendarDays, Eye, List, FileText, MessageSquare } from "lucide-react"
import Link from "next/link"
import { headers } from "next/headers"
import { client } from "@/lib/api"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { formatDate } from "@/lib/documents"

type DocumentPageProps = {
  params: { id: string }
  searchParams: { view?: string }
}

export default async function DocumentPage({
  params,
  searchParams,
}: DocumentPageProps) {
  const { id } = await params
  const { view } = await searchParams
  const isViewingDocument = view === "true"
  const incoming = await headers()
  const cookieHeader = incoming.get("cookie") ?? ""
  const { data, error } = await client.documents({ id }).get({
    headers: {
      cookie: cookieHeader,
    },
  })
  const { data: conversations } = await client
    .documents({ id })
    .conversations.get({
      headers: {
        cookie: cookieHeader,
      },
    })
  const conversationItems = conversations ?? []

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
                <Link
                  href={data.url}
                  className="text-sm text-primary underline-offset-4 hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open source file
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Conversations</CardTitle>
            <CardDescription>
              Recent Q&amp;A threads tied to this document.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {conversationItems.length ? (
              <div className="flex flex-col gap-3">
                {conversationItems.map((conversation) => (
                  <div
                    key={conversation.id}
                    className="flex items-center justify-between gap-4 rounded-lg border bg-background px-4 py-3"
                  >
                    <div className="flex flex-col gap-1">
                      <p className="font-medium">
                        {conversation.title ?? "Untitled conversation"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Started {formatDate(conversation.createdAt)}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" disabled>
                      Open
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <MessageSquare />
                  </EmptyMedia>
                  <EmptyTitle>No conversations yet</EmptyTitle>
                  <EmptyDescription>
                    Start a new question to create the first thread.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button disabled>Start conversation</Button>
                </EmptyContent>
              </Empty>
            )}
          </CardContent>
        </Card>
      )}
    </main>
  )
}
