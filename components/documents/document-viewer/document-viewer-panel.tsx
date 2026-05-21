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

  return (
    <section className="flex min-h-0 flex-col gap-4">
      <PDFViewer />
    </section>
  )
}
