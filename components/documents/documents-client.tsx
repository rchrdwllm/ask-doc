"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import {
  LayoutGrid,
  List
} from "lucide-react"
import { UploadDialog } from "@/components/documents/upload-dialog"
import type { DocumentRow } from "@/db/schema"
import type { DocumentDisplay, ViewMode } from "@/lib/documents"
import { DocumentsList } from "@/components/documents/documents-list"
import { DocumentsGrid } from "@/components/documents/documents-grid"
import { DocumentsEmptyState } from "@/components/documents/documents-empty-state"
import { DocumentsButtonGroup } from "@/components/documents/documents-button-group"
import { DocumentsDeleteDialog } from "@/components/documents/documents-delete-dialog"
import { useRouter } from "@bprogress/next/app"

type DocumentsClientProps = {
  documents: DocumentRow[]
}

export default function DocumentsClient({ documents }: DocumentsClientProps) {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [documentItems, setDocumentItems] = useState<DocumentDisplay[]>(() =>
    documents.map((doc) => ({
      ...doc,
      formattedSize: doc.storage_path ? "—" : undefined,
    }))
  )
  const [deleteTarget, setDeleteTarget] = useState<DocumentDisplay | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUploadOpen, setIsUploadOpen] = useState(false)

  useEffect(() => {
    setDocumentItems(
      documents.map((doc) => ({
        ...doc,
        formattedSize: doc.storage_path ? "—" : undefined,
      }))
    )
  }, [documents])

  const handleDeleteOpen = (doc: DocumentDisplay) => {
    setDeleteTarget(doc)
    setIsDeleteOpen(true)
  }

  const handleDeleteOpenChange = (open: boolean) => {
    setIsDeleteOpen(open)
    if (!open) {
      setDeleteTarget(null)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    const toastId = toast.loading("Deleting document…")
    try {
      const response = await fetch(`/api/documents/${deleteTarget.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete document")
      }

      setDocumentItems((items) => items.filter((doc) => doc.id !== deleteTarget.id))
      setIsDeleteOpen(false)
      toast.success("Document deleted", { id: toastId })
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("askdoc:documents-updated"))
      }
    } catch (error) {
      console.error(error)
      toast.error("Failed to delete document", { id: toastId })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleOpenDocument = (doc: DocumentDisplay) => {
    router.push(`/documents/${doc.id}`)
  }

  const handleViewDocument = (doc: DocumentDisplay) => {
    router.push(`/documents/${doc.id}?view=true`)
  }

  return (
    <main className="flex flex-col gap-6 p-8">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-3xl font-semibold">Documents</h1>
        </div>
        <p className="text-muted-foreground">
          Manage your uploaded documents for AI-powered Q&amp;A
        </p>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {documentItems.length} document{documentItems.length !== 1 ? "s" : ""}
        </p>
        <DocumentsButtonGroup
          buttons={[
            {
              value: "list" as ViewMode,
              icon: List,
              label: "List view",
            },
            {
              value: "grid" as ViewMode,
              icon: LayoutGrid,
              label: "Grid view",
            },
          ]}
          value={viewMode}
          onChange={setViewMode}
        />
      </div>

      {documentItems.length === 0 ? (
        <DocumentsEmptyState onUpload={() => setIsUploadOpen(true)} />
      ) : viewMode === "list" ? (
        <DocumentsList
          documents={documentItems}
          onDelete={handleDeleteOpen}
          onOpen={handleOpenDocument}
          onView={handleViewDocument}
        />
      ) : (
        <DocumentsGrid
          documents={documentItems}
          onDelete={handleDeleteOpen}
          onOpen={handleOpenDocument}
          onView={handleViewDocument}
        />
      )}

      <UploadDialog open={isUploadOpen} onOpenChange={setIsUploadOpen} />

      <DocumentsDeleteDialog
        open={isDeleteOpen}
        onOpenChange={handleDeleteOpenChange}
        isDeleting={isDeleting}
        document={deleteTarget}
        onConfirm={handleDeleteConfirm}
      />
    </main>
  )
}
