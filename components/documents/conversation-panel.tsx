"use client"

import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message"
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input"
import { Separator } from "@/components/ui/separator"

export type ConversationMessage = {
  id: string
  role: "assistant" | "user"
  text: string
}

type ConversationPanelProps = {
  messages: ConversationMessage[]
}

export default function ConversationPanel({
  messages,
}: ConversationPanelProps) {
  const handleSubmit = () => { }

  return (
    <section className="flex min-h-0 flex-col border-l border-border">
      <div className="flex flex-col gap-1 border-b border-border p-4">
        <h2 className="font-heading text-xl font-semibold">Messages</h2>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-4">
        {messages.map((message) => (
          <Message from={message.role} key={message.id}>
            <MessageContent>
              <MessageResponse>{message.text}</MessageResponse>
            </MessageContent>
          </Message>
        ))}
      </div>
      <Separator />
      <div className="flex flex-col gap-4 p-4">
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputTextarea
            placeholder="Ask a question about this document..."
          />
          <PromptInputFooter>
            <PromptInputSubmit />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </section>
  )
}
