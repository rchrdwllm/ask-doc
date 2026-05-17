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
import { ConversationMessagesEmptyState } from "@/components/documents/conversation-messages-empty-state"
import { Separator } from "@/components/ui/separator"
import { MessageRow } from "@/db/schema"

type ConversationPanelProps = {
  messages: MessageRow[]
}

export default function ConversationPanel({
  messages,
}: ConversationPanelProps) {
  const handleSubmit = () => { }
  const handlePrompt = () => { }

  return (
    <section className="flex min-h-0 flex-col border-l border-border">
      <div className="flex flex-col gap-1 border-b border-border p-4">
        <h2 className="font-heading text-xl font-semibold">Messages</h2>
      </div>
      {messages.length ? (
        <div className="flex flex-1 flex-col gap-4 p-4">
          {messages.map((message) => (
            <Message from={message.role} key={message.id}>
              <MessageContent>
                <MessageResponse>{message.content}</MessageResponse>
              </MessageContent>
            </Message>
          ))}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center p-4">
          <ConversationMessagesEmptyState onPrompt={handlePrompt} />
        </div>
      )}
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
