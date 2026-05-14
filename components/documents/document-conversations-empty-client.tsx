"use client"

import { MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

type DocumentConversationsEmptyClientProps = {
  documentId: string
}

export function DocumentConversationsEmptyClient({
  documentId,
}: DocumentConversationsEmptyClientProps) {
  const handleStart = () => {
    void documentId
  }

  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <MessageSquare />
        </EmptyMedia>
        <EmptyTitle>No conversations yet</EmptyTitle>
        <EmptyDescription>
          Start a new question to create the first thread.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={handleStart}>Start conversation</Button>
      </EmptyContent>
    </Empty>
  )
}
