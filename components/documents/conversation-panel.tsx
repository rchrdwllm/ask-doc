"use client"

import {
  Message,
  MessageContent
} from "@/components/ai-elements/message"
import {
  PromptInput,
  PromptInputFooter,
  PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input"
import { ConversationMessagesEmptyState } from "@/components/documents/conversation-messages-empty-state"
import { Separator } from "@/components/ui/separator"
import { MessageRow } from "@/db/schema"
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from "ai"
import { useParams } from "next/navigation"
import 'flowtoken/dist/styles.css'
import { AnimatedMarkdown } from 'flowtoken'

type ConversationPanelProps = {
  messages: MessageRow[]
}

export default function ConversationPanel({
  // messages,
}: ConversationPanelProps) {
  const params = useParams();
  const documentId = params.documentId
  const conversationId = params.conversationId
  const { messages: newMessages, sendMessage, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/ai/chat",
      body: {
        documentId,
        conversationId
      }
    }),
  })

  const handleSubmit = (message: PromptInputMessage) => {
    sendMessage({ text: message.text, metadata: { documentId, conversationId } });
  }

  return (
    <section className="flex min-h-0 flex-col border-l border-border">
      <div className="flex flex-col gap-1 border-b border-border p-4">
        <h2 className="font-heading text-xl font-semibold">Messages</h2>
      </div>
      {newMessages.length ? (
        <div className="flex flex-1 flex-col gap-4 p-4">
          {newMessages.map((message) => (
            <Message from={message.role} key={message.id}>
              <MessageContent>
                {message.parts.map((part, index) => {
                  if (part.type !== "text") return null

                  return (
                    <div key={`${message.id}-${index}`}>
                      <AnimatedMarkdown content={part.text}
                        animation="dropIn"
                        animationDuration="0.5s"
                        animationTimingFunction="ease-in-out"
                      />
                    </div>
                  )
                })}
              </MessageContent>
            </Message>
          ))}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center p-4">
          <ConversationMessagesEmptyState />
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
