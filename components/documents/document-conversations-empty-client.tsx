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
import { client } from "@/lib/api"
import { toast } from "sonner"
import { useRouter } from "@bprogress/next/app"

type DocumentConversationsEmptyClientProps = {
  documentId: string
}

export function DocumentConversationsEmptyClient({
  documentId,
}: DocumentConversationsEmptyClientProps) {
  const router = useRouter();

  const handleStart = async () => {
    const { data, error } = await client.documents({ id: documentId }).conversations.post();

    if (error) {
      toast.error(error.value.message || "Failed to start conversation");
      return;
    }

    console.log({ data });

    router.push(`/documents/${documentId}/conversations/${data.id}`);
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
