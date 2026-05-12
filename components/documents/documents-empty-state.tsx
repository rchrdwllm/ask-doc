"use client"

import { FileText, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

type DocumentsEmptyStateProps = {
  onUpload: () => void
}

export function DocumentsEmptyState({ onUpload }: DocumentsEmptyStateProps) {
  return (
    <Empty>
      <EmptyMedia variant="icon">
        <FileText />
      </EmptyMedia>
      <EmptyHeader>
        <EmptyTitle>No documents yet</EmptyTitle>
        <EmptyDescription>
          Upload your first PDF document to get started with AI-powered Q&amp;A.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={onUpload}>
          <Upload data-icon="inline-start" />
          Upload Document
        </Button>
      </EmptyContent>
    </Empty>
  )
}
