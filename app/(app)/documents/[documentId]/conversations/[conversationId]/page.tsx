import dynamic from "next/dynamic"
import { headers } from "next/headers"
import { client } from "@/lib/api"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

type ConversationPageProps = {
  params: Promise<{
    documentId: string
    conversationId: string
  }>
}

const DocumentViewerPanel = dynamic(
  () => import("@/components/documents/document-viewer/document-viewer-panel")
)
const ConversationPanel = dynamic(
  () => import("@/components/documents/conversation-panel")
)

export default async function ConversationPage({
  params,
}: ConversationPageProps) {
  const { conversationId, documentId } = await params
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
    <main className="h-full flex">
      <ResizablePanelGroup className="w-auto flex-1" orientation="horizontal">
        <ResizablePanel defaultSize="60%" minSize="30%">
          <DocumentViewerPanel documentId={documentId} />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize="40%" minSize="25%">
          <ConversationPanel
            conversationTitle={conversation.title ?? "Untitled Conversation"}
            messages={messages}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </main>
  )
}
