# Document Viewer Implementation Decisions

This document explains the design decisions behind the PDF viewer feature, including the signed URL endpoint, client loading strategy, and component structure.

## Purpose and scope

The goal is to render the actual stored PDF for a document, not a placeholder. This includes:

- Serving a protected, user-owned PDF from storage.
- Loading the PDF from storage via a short-lived signed URL.
- Keeping UI behavior predictable (loading and error states).
- Organizing code for clarity and future splitting.

## End-to-end flow

1. The PDF is stored in Supabase Storage under `document.storage_path`.
2. The API exposes a protected signed URL endpoint that validates ownership.
3. The client requests a short-lived signed URL.
4. EmbedPDF loads the PDF directly from storage using `openDocumentUrl`.

## Why a signed URL endpoint

Serving the PDF through the app server creates unnecessary bandwidth and coupling. A signed URL lets the backend act as an authorization gate while the storage provider serves the file directly. This reduces server load and scales with storage infrastructure.

## Signed URL lifetime and caching

- The URL expires after 15 minutes to limit exposure.
- The JSON response is cacheable for 15 minutes using `Cache-Control: private, max-age=900`.
- The browser can reuse the URL during that window, and storage handles the file delivery.

## Why Eden/Treaty for the signed URL

The signed URL endpoint returns JSON and fits Eden/Treaty's typed request/response model. Using the shared `client` keeps the data flow consistent with other components, and the PDF itself still loads directly from storage via the signed URL.

## Auth and ownership checks

The signed URL endpoint verifies:

- A valid session exists.
- The document exists.
- The document belongs to the current user.

This prevents direct access to another user's stored file by ID.

## EmbedPDF integration choices

- The document manager plugin is used to control document loading.
- The file is opened with `openDocumentUrl` so storage serves the PDF directly.
- Rendering is driven by the active document ID, matching EmbedPDF's model.

## UI and error handling

- A skeleton is shown while the engine or document is loading.
- A simple inline error state is shown for fetch or render failures.
- Errors are kept local to the viewer to avoid breaking the rest of the page.

## File organization

`DocumentLoader` lives in its own file to keep `PDFViewer` focused on rendering and to allow future code-splitting. The loader is the only place that knows about the signed URL request and load logic.
