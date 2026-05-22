import { client } from "@/lib/api";
import { PDFViewer } from "./pdf-viewer";
import { headers } from "next/headers";

type DocumentViewerPanelProps = {
  documentId: string;
}

export default async function DocumentViewerPanel({ documentId }: DocumentViewerPanelProps) {
  const incoming = await headers()
  const cookieHeader = incoming.get("cookie") ?? ""
  const { data: document } = await client.documents({ id: documentId }).get({
    headers: {
      cookie: cookieHeader,
    }
  })

  if (!document) {
    return (
      <div className="flex h-full items-center justify-center">
        <p>Document not found</p>
      </div>
    )
  }

  const fileNameFromPath = document.storage_path.split("/").pop()
  const fileName = fileNameFromPath || `${document.title}.pdf`

  return (
    <section className="flex min-h-0 flex-col gap-4 h-full">
      <PDFViewer documentId={document.id} fileName={fileName} />
    </section>
  )
}
