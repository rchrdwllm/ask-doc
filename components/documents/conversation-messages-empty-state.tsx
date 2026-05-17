"use client"

import { MessageSquare } from "lucide-react"
import {
  Empty, EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from "@/components/ui/empty"

export function ConversationMessagesEmptyState() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <MessageSquare />
        </EmptyMedia>
        <EmptyTitle>No messages yet</EmptyTitle>
        <EmptyDescription>
          Ask your first question to start this conversation.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
