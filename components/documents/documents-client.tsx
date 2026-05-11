"use client"

import { useState } from "react"
import {
  FileText,
  Upload,
  MoreHorizontal,
  LayoutGrid,
  List,
  Trash2,
  Download,
  Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription, CardHeader,
  CardTitle
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle, EmptyContent } from "@/components/ui/empty"
import type { DocumentRow, DocumentStatus } from "@/db/schema"

type ViewMode = "list" | "grid"

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
}

interface DocumentDisplay extends Omit<DocumentRow, "storage_path" | "errorMessage"> {
  formattedSize?: string
  errorMessage?: string | null
}

function ListView({ documents }: { documents: DocumentDisplay[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[40%]">Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Pages</TableHead>
          <TableHead>Uploaded</TableHead>
          <TableHead className="w-[5%]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.map((doc) => (
          <TableRow key={doc.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                  <FileText className="size-4 text-muted-foreground" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium truncate max-w-[300px]">{doc.title}</span>
                  {doc.errorMessage && (
                    <span className="text-xs text-destructive truncate max-w-[300px]">
                      {doc.errorMessage}
                    </span>
                  )}
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Badge
                variant={
                  doc.status === "ready"
                    ? "default"
                    : doc.status === "processing"
                    ? "secondary"
                    : "destructive"
                }
              >
                {(doc.status ?? "processing").charAt(0).toUpperCase() + (doc.status ?? "processing").slice(1)}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {doc.pageCount ?? "—"}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDate(doc.createdAt)}
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-8">
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem>
                    <Eye className="size-4" />
                    View
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Download className="size-4" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">
                    <Trash2 className="size-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function GridView({ documents }: { documents: DocumentDisplay[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {documents.map((doc) => (
        <Card key={doc.id} className="group cursor-pointer transition-shadow hover:shadow-md">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                <FileText className="size-5 text-muted-foreground" />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem>
                    <Eye className="size-4" />
                    View
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Download className="size-4" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">
                    <Trash2 className="size-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <CardTitle className="truncate">{doc.title}</CardTitle>
            <CardDescription className="line-clamp-2">
              Uploaded {formatDate(doc.createdAt)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge
                variant={
                  doc.status === "ready"
                    ? "default"
                    : doc.status === "processing"
                    ? "secondary"
                    : "destructive"
                }
                className="text-xs"
              >
                {(doc.status ?? "processing").charAt(0).toUpperCase() + (doc.status ?? "processing").slice(1)}
              </Badge>
              <Separator orientation="vertical" className="h-4" />
              <span>{doc.pageCount ?? "—"} pages</span>
            </div>
            {doc.errorMessage && (
              <p className="mt-2 text-xs text-destructive truncate">
                {doc.errorMessage}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <Empty>
      <EmptyMedia variant="icon">
        <FileText className="size-6" />
      </EmptyMedia>
      <EmptyHeader>
        <EmptyTitle>No documents yet</EmptyTitle>
        <EmptyDescription>
          Upload your first PDF document to get started with AI-powered Q&amp;A.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button>
          <Upload className="size-4" data-icon="inline-start" />
          Upload Document
        </Button>
      </EmptyContent>
    </Empty>
  )
}

type DocumentsClientProps = {
  documents: DocumentRow[]
}

export default function DocumentsClient({ documents }: DocumentsClientProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const displayDocuments: DocumentDisplay[] = documents.map((doc) => ({
    ...doc,
    formattedSize: doc.storage_path ? "—" : undefined,
  }))

  return (
    <main className="flex flex-col gap-6 p-8">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-3xl font-semibold">Documents</h1>
          <Button>
            <Upload className="size-4" data-icon="inline-start" />
            Upload
          </Button>
        </div>
        <p className="text-muted-foreground">
          Manage your uploaded documents for AI-powered Q&amp;A
        </p>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {documents.length} document{documents.length !== 1 ? "s" : ""}
        </p>
        <ButtonGroup
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

      {documents.length === 0 ? (
        <EmptyState />
      ) : viewMode === "list" ? (
        <ListView documents={displayDocuments} />
      ) : (
        <GridView documents={displayDocuments} />
      )}
    </main>
  )
}

function ButtonGroup({
  buttons,
  value,
  onChange,
}: {
  buttons: { value: ViewMode; icon: React.ComponentType<{ className?: string }>; label: string }[]
  value: ViewMode
  onChange: (value: ViewMode) => void
}) {
  return (
    <div className="inline-flex rounded-lg border bg-muted p-0.5">
      {buttons.map((button) => (
        <Button
          key={button.value}
          variant={value === button.value ? "default" : "ghost"}
          size="sm"
          className="h-8 px-3"
          onClick={() => onChange(button.value)}
          aria-label={button.label}
        >
          <button.icon className="size-4" />
        </Button>
      ))}
    </div>
  )
}