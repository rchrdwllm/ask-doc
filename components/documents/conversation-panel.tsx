"use client"

import {
  Message,
  MessageContent
} from "@/components/ai-elements/message"
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger
} from "@/components/ai-elements/sources"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { MessageRow } from "@/db/schema"
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from "ai"
import { useParams, useRouter } from "next/navigation"
import { Loader2, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import 'flowtoken/dist/styles.css'
import { AnimatedMarkdown } from 'flowtoken'
import { Shimmer } from "@/components/ai-elements/shimmer"
import {
  Suggestion,
  Suggestions,
} from "@/components/ai-elements/suggestion"
import { useEffect, useRef, useState } from "react"
import { client } from "@/lib/api"
import { toast } from "sonner"
import { Skeleton } from "../ui/skeleton"

type ConversationPanelProps = {
  conversationTitle: string;
  messages: MessageRow[];
}

export default function ConversationPanel({
  conversationTitle,
}: ConversationPanelProps) {
  const params = useParams();
  const documentId = params.documentId
  const conversationId = params.conversationId
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [renameValue, setRenameValue] = useState(conversationTitle)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { messages: newMessages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/ai/chat",
      body: {
        documentId,
        conversationId
      }
    }),
  });
  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])

  const handleSubmit = async (message: PromptInputMessage) => {
    if (newMessages.length == 0) {
      setIsLoading(true);

      client.ai.title.post({ text: message.text }).then(({ data, error }) => {
        if (error) {
          toast.error(error.value.message);
          setIsLoading(false);
          return;
        }

        if (data) {
          client.conversations({ id: conversationId as string }).patch({
            title: data.generatedTitle,
          }).then(({ data, error }) => {
            if (error) {
              toast.error(error.value.message);
              setIsLoading(false);
              return;
            }

            if (data) {
              router.refresh();
              setIsLoading(false);
            }
          });
        }
      })
    }

    sendMessage({ text: message.text, metadata: { documentId, conversationId } });
  }

  const handleRename = async () => {
    setIsLoading(true)

    const { data, error } = await client.conversations({ id: conversationId as string }).patch({
      title: renameValue,
    });

    if (error) {
      toast.error(error.value.message);

      router.refresh();
      setIsLoading(false)
      setRenameDialogOpen(false)

      return;
    }

    if (data) {
      toast.success(`Renamed conversation to "${data.title}"`);

      router.refresh();
      setIsLoading(false)
      setRenameDialogOpen(false)

      return;
    }
  }

  const handleDelete = async () => {
    setIsLoading(true)

    const { data, error } = await client.conversations({ id: conversationId as string }).delete();

    if (error) {
      toast.error(error.value.message);

      setIsLoading(false)
      setDeleteDialogOpen(false)

      return;
    }

    if (data) {
      toast.success(`Conversation deleted`);

      setIsLoading(false)
      setDeleteDialogOpen(false)
      router.push(`/documents/${documentId}`);

      return;
    }
  }

  const fetchSuggestions = async () => {
    const { data, error } = await client.ai.suggestions.post({
      documentId: documentId as string,
    });

    if (error) {
      return;
    }

    if (data) {
      setSuggestions(data);
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [newMessages])

  useEffect(() => {
    setRenameValue(conversationTitle)
  }, [conversationTitle])

  useEffect(() => {
    fetchSuggestions();
  }, [])

  return (
    <section className="flex h-full overflow-y-auto flex-col border-l border-border">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border p-4">
        {isLoading ? (
          <Skeleton className="h-6 w-full" />
        ) : (
          <h2 className="flex-1 truncate font-heading text-xl font-semibold">
            {conversationTitle}
          </h2>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onSelect={(e) => {
              setRenameDialogOpen(true)
            }}>
              <Pencil />
              Rename conversation
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={(e) => {
              setDeleteDialogOpen(true)
            }}>
              <Trash2 />
              Delete conversation
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {newMessages.length ? (
        <div ref={messagesEndRef} className="flex h-auto overflow-y-auto flex-col gap-4 p-4">
          {newMessages.map((message) => {
            const sourceParts = message.parts.filter(
              (part) =>
                part.type === "source-url" || part.type === "source-document"
            )

            return (
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

                  {sourceParts.length > 0 && status !== 'streaming' && (
                    <Sources className="mt-2">
                      <SourcesTrigger count={sourceParts.length} />
                      <SourcesContent>
                        {sourceParts.map((part) => {
                          if (part.type === "source-url") {
                            return (
                              <Source
                                key={part.sourceId}
                                href={part.url}
                                title={part.title ?? part.url}
                              />
                            )
                          }

                          return (
                            <Source
                              key={part.sourceId}
                              href={`/documents/${documentId}?view=true`}
                              title={part.title}
                            />
                          )
                        })}
                      </SourcesContent>
                    </Sources>
                  )}
                </MessageContent>
              </Message>
            )
          })}
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
      <div className="mt-auto">
        <Separator />
        <div className="flex flex-col gap-4 p-4">
          {!!suggestions.length && (
            <Suggestions>
              {suggestions.map((suggestion) => (
                <Suggestion
                  key={suggestion}
                  suggestion={suggestion}
                  onClick={(value) =>
                    sendMessage({
                      text: value,
                      metadata: { documentId, conversationId },
                    })
                  }
                />
              ))}
            </Suggestions>
          )}
          <PromptInput onSubmit={handleSubmit}>
            <PromptInputTextarea
              placeholder="Ask a question about this document..."
            />
            <PromptInputFooter>
              <PromptInputSubmit />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>

      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename conversation</DialogTitle>
            <DialogDescription>
              Enter a new name for this conversation.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder="Conversation name"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button disabled={isLoading} onClick={handleRename}>
              {isLoading ? <><Loader2 className="animate-spin" /> Renaming...</> : "Rename"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this conversation? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={isLoading} onClick={handleDelete}>
              {isLoading ? <><Loader2 className="animate-spin" /> Deleting...</> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
