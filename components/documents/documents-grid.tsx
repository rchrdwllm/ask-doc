"use client"

import {
  FileText,
  MoreHorizontal,
  Trash2,
  Download,
  Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { DocumentDisplay } from "@/lib/documents"
import { formatDate } from "@/lib/documents"

type DocumentsGridProps = {
  documents: DocumentDisplay[]
  onDelete: (doc: DocumentDisplay) => void
}

export function DocumentsGrid({ documents, onDelete }: DocumentsGridProps) {
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
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem>
                    <Eye />
                    View
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Download />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onSelect={() => onDelete(doc)}>
                    <Trash2 />
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
