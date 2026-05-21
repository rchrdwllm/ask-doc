"use client"

import Link from "next/link"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { useRouter } from "@bprogress/next/app"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { client } from "@/lib/api"
import { toast } from "sonner"
import { useState } from "react"

type ConversationCardProps = {
  documentId: string
  conversationId: string
  title: string | null
  previewText: string
  previewTime: string
}

export function ConversationCard({
  documentId,
  conversationId,
  title,
  previewText,
  previewTime,
}: ConversationCardProps) {
  const router = useRouter()
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [renameValue, setRenameValue] = useState(title ?? "")
  const [isPending, setIsPending] = useState(false)

  const handleRename = async () => {
    setIsPending(true)

    const { data, error } = await client
      .conversations({ id: conversationId })
      .patch({ title: renameValue })

    if (error) {
      toast.error(error.value.message)
      router.refresh()
      setIsPending(false)
      setRenameDialogOpen(false)
      return
    }

    if (data) {
      toast.success(`Renamed conversation to "${data.title}"`)
      router.refresh()
      setIsPending(false)
      setRenameDialogOpen(false)
    }
  }

  const handleDelete = async () => {
    setIsPending(true)

    const { data, error } = await client
      .conversations({ id: conversationId })
      .delete()

    if (error) {
      toast.error(error.value.message)
      setIsPending(false)
      setDeleteDialogOpen(false)
      return
    }

    if (data) {
      toast.success("Conversation deleted")
      setIsPending(false)
      setDeleteDialogOpen(false)
      router.refresh()
    }
  }

  return (
    <>
      <Card className="flex h-full flex-col border transition-colors hover:border-primary">
        <CardHeader className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="min-w-0 flex-1">
              <Link href={`/documents/${documentId}/conversations/${conversationId}`}>
                {title ?? "Untitled conversation"}
              </Link>
            </CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0"
                >
                  <MoreHorizontal data-icon="inline-start" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onSelect={() => setRenameDialogOpen(true)}>
                  <Pencil data-icon="inline-start" />
                  Rename conversation
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 data-icon="inline-start" />
                  Delete conversation
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="flex items-center gap-2 mt-auto">
          <span className="line-clamp-2 text-xs text-muted-foreground">
            {previewText}
          </span>
          <Separator orientation="vertical" />
          <span className="shrink-0 text-xs text-muted-foreground">
            {previewTime}
          </span>
        </CardContent>
      </Card>

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
            <Button disabled={isPending} onClick={handleRename}>
              {isPending ? "Renaming..." : "Rename"}
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
            <AlertDialogAction disabled={isPending} onClick={handleDelete}>
              {isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
