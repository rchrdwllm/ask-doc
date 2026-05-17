export default function DocumentViewerPanel() {
  return (
    <section className="flex min-h-0 flex-col gap-4 bg-muted p-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-xl font-semibold">Document preview</h2>
        <p className="text-sm text-muted-foreground">
          The PDF viewer will appear here once connected.
        </p>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="flex max-w-sm flex-col gap-2 text-center">
          <p className="font-medium">PDF preview coming soon</p>
          <p className="text-sm text-muted-foreground">
            This panel will render the full document preview.
          </p>
        </div>
      </div>
    </section>
  )
}
