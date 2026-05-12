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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { DocumentDisplay } from "@/lib/documents"
import { formatDate } from "@/lib/documents"

type DocumentsListProps = {
  documents: DocumentDisplay[]
  onDelete: (doc: DocumentDisplay) => void
}

export function DocumentsList({ documents, onDelete }: DocumentsListProps) {
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
          <TableRow key={doc.id} id={`document-${doc.id}`}>
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
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
