"use client"

import {
  Message,
  MessageContent
} from "@/components/ai-elements/message"
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger
} from "@/components/ai-elements/reasoning"
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
import { Shimmer } from "@/components/ai-elements/shimmer"

type ConversationPanelProps = {
  messages: MessageRow[]
}

export default function ConversationPanel({
  // messages,
}: ConversationPanelProps) {
  const params = useParams();
  const documentId = params.documentId
  const conversationId = params.conversationId
  const { messages: newMessages, sendMessage, status } = useChat({
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
    <section className="flex h-full overflow-y-auto flex-col border-l border-border">
      <div className="flex flex-col gap-1 border-b border-border p-4">
        <h2 className="font-heading text-xl font-semibold">Messages</h2>
      </div>
      {newMessages.length ? (
        <div className="flex h-full flex-col gap-4 p-4">
          {newMessages.map((message) => (
            <Message from={message.role} key={message.id}>
              <MessageContent>
                {message.parts.map((part, index) => {
                  if (part.type === "text") {
                    return (
                      <div key={`${message.id}-${index}`}>
                        <AnimatedMarkdown
                          content={part.text}
                          animation="dropIn"
                          animationDuration="0.5s"
                          animationTimingFunction="ease-in-out"
                        />
                      </div>
                    )
                  }

                  if (part.type === "reasoning") {
                    return (
                      <Reasoning
                        key={`${message.id}-${index}`}
                        isStreaming={part.state === "streaming"}
                        className="mt-2"
                      >
                        <ReasoningTrigger />
                        <ReasoningContent>{part.text}</ReasoningContent>
                      </Reasoning>
                    )
                  }

                  return null
                })}
              </MessageContent>
            </Message>
          ))}
          {(status === "submitted" || status === "streaming") && (
            <Message from="assistant" key="loading">
              <MessageContent>
                <Shimmer>
                  Thinking...
                </Shimmer>
              </MessageContent>
            </Message>
          )}
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
