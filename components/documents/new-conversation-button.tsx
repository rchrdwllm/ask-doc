"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useRouter } from "@bprogress/next/app"
import { createConversation } from "@/lib/server/actions/conversations"

type NewConversationButtonProps = {
  documentId: string
}

export function NewConversationButton({
  documentId,
}: NewConversationButtonProps) {
  const router = useRouter()

  const handleNewConversation = async () => {
    const { data, error } = await createConversation(documentId)

    if (error) {
      toast.error(error.value.message || "Failed to start conversation")
      return
    } else if (!data) {
      toast.error("Failed to start conversation")
      return
    }

    router.push(`/documents/${documentId}/conversations/${data.id}`)
  }

  return (
    <Button onClick={handleNewConversation}>
      <Plus data-icon="inline-start" />
      New conversation
    </Button>
  )
}
