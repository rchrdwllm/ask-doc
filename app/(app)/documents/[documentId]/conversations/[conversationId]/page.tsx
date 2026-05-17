import dynamic from "next/dynamic"
import type { ConversationMessage } from "@/components/documents/conversation-panel"

type ConversationPageProps = {
  params: {
    documentId: string
    conversationId: string
  }
}

const DocumentViewerPanel = dynamic(
  () => import("@/components/documents/document-viewer-panel")
)
const ConversationPanel = dynamic(
  () => import("@/components/documents/conversation-panel")
)

const messages: ConversationMessage[] = [
  {
    id: "m1",
    role: "assistant",
    text: "I reviewed the document and found the summary section on pages 3-4. What would you like to explore next?",
  },
  {
    id: "m2",
    role: "user",
    text: "Pull the key points about the security controls and list them with their section names.",
  },
  {
    id: "m3",
    role: "assistant",
    text: "The controls are organized under Access Management, Data Protection, and Monitoring. I can surface each section and cite the exact paragraphs.",
  },
]

export default function ConversationPage({ params }: ConversationPageProps) {
  void params
  return (
    <main className="flex flex-1 flex-col gap-4 p-0 md:p-0">
      <div className="grid flex-1 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <DocumentViewerPanel />
        <ConversationPanel messages={messages} />
      </div>
    </main>
  )
}
