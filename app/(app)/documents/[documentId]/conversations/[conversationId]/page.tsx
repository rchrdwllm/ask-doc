import type { Metadata } from "next"
import dynamic from "next/dynamic"
import { headers } from "next/headers"
import { client } from "@/lib/api"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { getConversationById } from "@/lib/server/conversations"
import { auth } from "@/lib/auth"
import { getConversationMessages } from "@/lib/server/messages"

type ConversationPageProps = {
  params: Promise<{
    documentId: string
    conversationId: string
  }>
}

export async function generateMetadata({
  params,
}: ConversationPageProps): Promise<Metadata> {
  const { conversationId } = await params
  const incoming = await headers()
  const cookieHeader = incoming.get("cookie") ?? ""
  const { data } = await client.conversations({ id: conversationId }).get({
    headers: {
      cookie: cookieHeader,
    },
  })

  return {
    title: data?.title ?? "Conversation",
  }
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
  const session = await auth.api.getSession({ headers: incoming })
  const { data: conversation } = await getConversationById(
    conversationId,
    cookieHeader,
    session!.user.id
  );
  const { data: messages } = await getConversationMessages(
    conversationId,
    cookieHeader,
    session!.user.id
  );

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
