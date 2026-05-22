# Document Viewer Implementation Decisions

This document explains the design decisions behind the PDF viewer feature, including the new file endpoint, client loading strategy, and component structure.

## Purpose and scope

The goal is to render the actual stored PDF for a document, not a placeholder. This includes:

- Serving a protected, user-owned PDF from storage.
- Loading the PDF as a binary buffer for EmbedPDF.
- Keeping UI behavior predictable (loading and error states).
- Organizing code for clarity and future splitting.

## End-to-end flow

1. The PDF is stored in Supabase Storage under `document.storage_path`.
2. The API exposes a protected file endpoint that validates ownership.
3. The client fetches the PDF as an `ArrayBuffer`.
4. EmbedPDF loads the buffer via `openDocumentBuffer` and renders pages.

## Why a binary file endpoint

The document viewer requires a raw PDF buffer. Returning JSON would corrupt binary data and complicate decoding. A dedicated endpoint that returns binary bytes avoids conversion overhead and keeps the client API simple.

## Why `Response` instead of `status(200, data)`

`status(200, data)` is used for JSON-serializable responses in Elysia. A PDF is binary, so we return a `Response` with the raw `ArrayBuffer` so the browser receives the exact bytes with the correct MIME type.

## Header decisions

- `Content-Type: application/pdf`
  Tells the browser how to interpret the bytes.
- `Content-Disposition: inline; filename="..."`
  Encourages inline rendering and provides a sensible filename.
- `Cache-Control: no-store`
  Avoids caching sensitive documents on shared devices.

## Why `fetch` instead of Eden/Treaty

Eden/Treaty is optimized for JSON responses with typed schemas. This endpoint returns a binary stream, which needs `response.arrayBuffer()`. Using `fetch` keeps the code small and direct, avoids JSON parsing, and fits EmbedPDF's buffer API.

## Auth and ownership checks

The file endpoint verifies:

- A valid session exists.
- The document exists.
- The document belongs to the current user.

This prevents direct access to another user's stored file by ID.

## EmbedPDF integration choices

- The document manager plugin is used to control document loading.
- The file is opened with `openDocumentBuffer` to avoid exposing a public URL.
- Rendering is driven by the active document ID, matching EmbedPDF's model.

## UI and error handling

- A skeleton is shown while the engine or document is loading.
- A simple inline error state is shown for fetch or render failures.
- Errors are kept local to the viewer to avoid breaking the rest of the page.

## File organization

`DocumentLoader` lives in its own file to keep `PDFViewer` focused on rendering and to allow future code-splitting. The loader is the only place that knows about the file endpoint and the fetch/buffer logic.
