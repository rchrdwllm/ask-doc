import dynamic from "next/dynamic"
import { headers } from "next/headers"
import { client } from "@/lib/api"

type ConversationPageProps = {
  params: Promise<{
    documentId: string
    conversationId: string
  }>
}

const DocumentViewerPanel = dynamic(
  () => import("@/components/documents/document-viewer-panel")
)
const ConversationPanel = dynamic(
  () => import("@/components/documents/conversation-panel")
)

export default async function ConversationPage({
  params,
}: ConversationPageProps) {
  const { conversationId } = await params
  const incoming = await headers()
  const cookieHeader = incoming.get("cookie") ?? ""

  const { data: conversation } = await client.conversations({
    id: conversationId,
  }).get({
    headers: {
      cookie: cookieHeader,
    },
  });

  const { data: messages } = await client.conversations({
    id: conversationId,
  }).messages.get({
    headers: {
      cookie: cookieHeader,
    },
  });

  if (!messages || !conversation) {
    return (
      <div className="flex h-full items-center justify-center">
        <p>Conversation not found</p>
      </div>
    )
  }

  return (
    <main className="flex h-full flex-col gap-4 p-0 md:p-0">
      <div className="grid h-full lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <DocumentViewerPanel />
        <ConversationPanel
          conversationTitle={conversation.title ?? "Untitled Conversation"}
          messages={messages}
        />
      </div>
    </main>
  )
}
