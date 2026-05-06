# Ask Doc - Product Requirements Document

**Version:** 1.0

**Status:** Draft

**Author:** William

**Purpose:** Learning project + portfolio piece covering RAG, embeddings, vector search, and backend pipelines

---

## 1. Executive Summary

### Problem Statement

Reading and extracting specific information from long PDF documents is slow and tedious. Users must manually scan through pages to find answers, losing time and context in the process.

### Proposed Solution

AskDoc lets users upload PDF documents and ask natural language questions about them. The system retrieves the most relevant sections of the document and generates grounded, cited answers using an LLM — eliminating manual searching.

### Success Criteria

- A user can upload a PDF and receive a first answer within 10 seconds of submitting a question
- Answer citations correctly reference the source chunk ≥ 90% of the time (verified manually against 20 test questions per document)
- Embedding + retrieval pipeline processes a 50-page PDF in under 30 seconds
- Similarity search returns the top-k chunks within 300ms for a document with up to 500 chunks
- Zero hallucinated citations — all referenced chunks must exist in the stored document

---

## 2. User Experience & Functionality

### User Personas

**Persona 1 — The Student**

A university student who needs to quickly pull specific information from research papers, textbooks, or lecture notes. Doesn't want to read the whole document. Wants direct answers with page-level references.

**Persona 2 — The Professional**

A working professional reviewing contracts, reports, or technical documentation. Needs to ask specific questions ("What are the payment terms?") and get grounded answers they can verify.

**Persona 3 — William (Developer / Portfolio Reviewer)**

Evaluating the technical depth of the implementation. Looking for evidence of RAG architecture, vector search, streaming, and proper citation handling — not just a ChatGPT wrapper.

---

### User Stories & Acceptance Criteria

### Auth

**Story:** As a user, I want to sign in with Google or email/password so that my documents are private to my account.

**Acceptance Criteria:**

- Google OAuth and credentials-based login both work via Better Auth
- Unauthenticated users are redirected to the login page
- Sessions persist across browser refreshes

---

### Document Upload

**Story:** As a user, I want to upload a PDF so that I can ask questions about its contents.

**Acceptance Criteria:**

- Accepts PDF files only; rejects other formats with a clear error message
- Maximum file size: 20MB. Files exceeding this are rejected before upload begins
- Upload progress is visible to the user
- On successful upload, processing begins automatically — the user sees a "Processing..." status indicator
- If processing fails, the user sees a specific error ("Could not extract text from this PDF") and the document is not saved
- A document record is created in the database only after processing succeeds

---

### Document Processing Pipeline

**Story:** As a system, I need to process an uploaded PDF into searchable chunks so that relevant sections can be retrieved at query time.

**Acceptance Criteria:**

- Text is extracted from the PDF server-side
- Text is split into chunks of ~500 tokens with a 50-token overlap between consecutive chunks
- Each chunk records its source page number(s)
- Embeddings are generated for each chunk using `text-embedding-004`
- Chunks and their embeddings are stored in a `document_chunks` table with pgvector
- Processing is handled as a background operation (not blocking the HTTP response)
- The document's status field updates from `processing` → `ready` on completion, or `error` on failure
- The client polls or receives a status update to reflect the current state

---

### Document Management

**Story:** As a user, I want to see all my uploaded documents and delete ones I no longer need.

**Acceptance Criteria:**

- Documents list page shows: filename, upload date, page count, status (`processing` / `ready` / `error`)
- Documents with `error` status display a retry or delete option
- Deleting a document removes the file from Supabase Storage, all associated chunks from the DB, and all associated conversations
- Users can only see and act on their own documents (ownership enforced server-side)

---

### Q&A Chat

**Story:** As a user, I want to ask natural language questions about a document and receive answers with source references.

**Acceptance Criteria:**

- Chat interface is scoped to a single document per session
- User types a question and submits; the AI response streams word-by-word into the UI
- Each answer includes source citations: chunk excerpt + page number
- Citations are displayed below the answer as collapsible reference cards
- If no relevant chunks are found (similarity score below threshold), the system responds: "I couldn't find relevant information in this document for that question." — it does not fabricate an answer
- Users can ask follow-up questions; the last 6 messages are included in the LLM context window
- Conversation history is persisted per document per user

---

### Non-Goals (MVP)

These are explicitly out of scope for the initial build:

- Support for file formats other than PDF (DOCX, TXT, etc.)
- Cross-document querying ("search across all my documents")
- Document sharing between users
- Conversation export (copy or download chat)
- Real-time collaborative Q&A
- Mobile-native app
- Usage limits or rate limiting per user
- Admin dashboard or analytics

---

## 3. AI System Requirements

### Models

| Task                        | Model                | Provider                 |
| --------------------------- | -------------------- | ------------------------ |
| Text generation + answering | `gemini-2.5-flash`   | Google via Vercel AI SDK |
| Embedding generation        | `text-embedding-004` | Google                   |

### Retrieval Architecture (RAG Pipeline)

**Ingestion (runs once per document):**

1. Extract raw text from PDF (server-side, `pdf-parse` or `pdfjs-dist`)
2. Chunk text into ~500-token segments with 50-token overlap
3. Tag each chunk with source page number(s)
4. Generate embeddings for each chunk via `text-embedding-004`
5. Store chunks + embeddings in `document_chunks` (pgvector column)

**Query (runs per user question):**

1. Generate embedding for the user's question via `text-embedding-004`
2. Run cosine similarity search against the document's chunks in pgvector
3. Retrieve top-5 chunks above a similarity threshold of 0.75
4. Construct prompt with retrieved chunks as context + last 6 conversation turns
5. Stream response from Gemini 2.5 Flash via Vercel AI SDK
6. Return response text + source chunk references to the client

### System Prompt

```
You are a document assistant. Answer the user's question using ONLY the provided document excerpts below.

Rules:
- If the answer is in the excerpts, answer directly and cite the source (e.g., [Page 3]).
- If the answer cannot be found in the excerpts, say: "I couldn't find relevant information in this document for that question."
- Do not use any knowledge outside of the provided excerpts.
- Keep answers concise and factual.

Document Excerpts:
{context}
```

### Context Window Management

- Maximum context per query: top-5 retrieved chunks (~2,500 tokens) + last 6 messages (~1,500 tokens) + system prompt (~300 tokens)
- Total estimated: ~4,300 tokens per request, well within Gemini 2.5 Flash's context window
- If a document has fewer than 5 chunks above threshold, include all qualifying chunks

### Evaluation Strategy

**Manual eval set:** For each major prompt change, run 20 questions against 2 test documents (one short ~10 pages, one long ~50 pages) and score:

| Metric             | Target | Method                                                          |
| ------------------ | ------ | --------------------------------------------------------------- |
| Citation accuracy  | ≥ 90%  | Manually verify cited chunk matches answer content              |
| Hallucination rate | 0%     | Check that no answers reference content not in retrieved chunks |
| Relevance          | ≥ 85%  | Rate retrieved chunks as relevant/irrelevant to the question    |
| Refusal accuracy   | 100%   | Confirm system refuses when no relevant chunk is found          |

Store eval results in `/evals/` directory as JSON. Re-run on every prompt or chunking strategy change.

---

## 4. Technical Specifications

### Tech Stack

| Layer        | Technology                                                           |
| ------------ | -------------------------------------------------------------------- |
| Framework    | Next.js 16 (App Router)                                              |
| Backend      | Elysia.js as Next.js route handler (`app/api/[[...slugs]]/route.ts`) |
| Auth         | Better Auth (Google OAuth + credentials)                             |
| Database     | Supabase (PostgreSQL + pgvector)                                     |
| ORM          | Drizzle ORM                                                          |
| API Client   | Eden Treaty (type-safe)                                              |
| AI SDK       | Vercel AI SDK                                                        |
| LLM          | Google Gemini 2.5 Flash                                              |
| Embeddings   | Google `text-embedding-004`                                          |
| File Storage | Supabase Storage                                                     |
| PDF Parsing  | `pdfjs-dist` (server-side)                                           |
| Styling      | Tailwind CSS + shadcn/ui                                             |

### Repo Structure

```
/
├── app/
│   ├── api/
│   │   └── [[...slugs]]/route.ts       # Elysia.js entry point
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (app)/
│   │   ├── documents/page.tsx           # Document list
│   │   ├── documents/[id]/page.tsx      # Q&A chat view
│   │   └── layout.tsx
│   └── layout.tsx
├── api/
│   ├── index.ts                         # Elysia app root
│   └── routes/
│       ├── documents.ts                 # Upload, list, delete
│       ├── chat.ts                      # Q&A + streaming
│       └── processing.ts               # Ingestion pipeline trigger
├── db/
│   ├── schema.ts
│   └── index.ts
├── lib/
│   ├── pdf.ts                           # PDF text extraction
│   ├── chunker.ts                       # Text chunking logic
│   ├── embeddings.ts                    # Embedding generation
│   └── retrieval.ts                     # Vector search queries
├── components/
├── hooks/
└── types/
```

### Database Schema

```tsx
// documents
export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  storagePath: text("storage_path").notNull(),
  pageCount: integer("page_count"),
  status: text("status").notNull().default("processing"), // 'processing' | 'ready' | 'error'
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
});

// document_chunks
export const documentChunks = pgTable("document_chunks", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  pageNumbers: integer("page_numbers").array(),
  chunkIndex: integer("chunk_index").notNull(),
  embedding: vector("embedding", { dimensions: 768 }), // text-embedding-004 output dimension
});

// conversations
export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// messages
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // 'user' | 'assistant'
  content: text("content").notNull(),
  sourceChunkIds: uuid("source_chunk_ids").array(), // chunks cited in this message
  createdAt: timestamp("created_at").defaultNow(),
});
```

### API Routes (Elysia.js)

| Method   | Path                               | Description                               |
| -------- | ---------------------------------- | ----------------------------------------- |
| `POST`   | `/api/documents/upload`            | Upload PDF, trigger processing            |
| `GET`    | `/api/documents`                   | List user's documents                     |
| `GET`    | `/api/documents/:id`               | Get single document + status              |
| `DELETE` | `/api/documents/:id`               | Delete document + chunks + storage        |
| `POST`   | `/api/documents/:id/chat`          | Send message, stream response + citations |
| `GET`    | `/api/documents/:id/conversations` | Get conversation history                  |

All routes require authentication. Return `404` (not `403`) for resources that don't belong to the requesting user.

### File Storage

- Uploaded PDFs stored in Supabase Storage under `documents/{userId}/{documentId}.pdf`
- Files are private (not publicly accessible)
- Signed URLs generated server-side for any download operations

### Security & Privacy

- All document access is scoped by `userId` at the query level — not just route-level middleware
- PDF files stored in a private Supabase Storage bucket
- No document content is logged or stored outside of the `document_chunks` table
- Environment variables: `GOOGLE_GENERATIVE_AI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `BETTER_AUTH_SECRET` — never exposed to the client
- File type validation performed server-side (MIME type check), not just client-side extension check

---

## 5. Risks & Roadmap

### Phased Rollout

**MVP (current scope)**

- Auth (Google OAuth + credentials)
- Single PDF upload + processing pipeline
- Q&A chat with streaming + source citations
- Document list + delete
- Manual evals for citation accuracy

**v1.1**

- Multiple documents per session ("ask about Document A or B")
- Conversation history sidebar per document
- Retry failed document processing
- Basic usage stats (tokens used, questions asked)

**v2.0**

- Document collections / folders
- Cross-document querying ("search across all my documents")
- Export conversation as markdown or PDF
- Shareable document links (read-only, no auth required)

---

### Technical Risks

| Risk                                                | Likelihood | Impact | Mitigation                                                                    |
| --------------------------------------------------- | ---------- | ------ | ----------------------------------------------------------------------------- |
| PDF text extraction fails on scanned/image PDFs     | High       | High   | Detect image-only PDFs early; show clear error. OCR support deferred to v1.1. |
| Embedding costs grow with large documents           | Medium     | Medium | Cap document size at 20MB / ~200 pages for MVP. Log token usage per document. |
| Retrieval returns irrelevant chunks (low precision) | Medium     | High   | Tune similarity threshold; test with diverse document types during eval.      |
| Processing pipeline blocks on large PDFs            | Medium     | Medium | Run processing asynchronously; poll status client-side every 3 seconds.       |
| Gemini rate limits during concurrent requests       | Low        | Medium | Add basic request queuing; surface rate limit errors gracefully to the user.  |
| Context window overflow on long conversations       | Low        | Low    | Cap conversation history at last 6 messages; summarize if needed in v1.1.     |

---

## 6. Resolved Decisions

| Decision                         | Resolution                                                                               |
| -------------------------------- | ---------------------------------------------------------------------------------------- |
| Conversation history persistence | Persisted per document per user across sessions. One conversation per document per user. |
| Chunk size configurability       | Fixed for MVP — 500 tokens per chunk, 50-token overlap. Not user-configurable.           |
| Duplicate document uploads       | Treated as a new document each time. No deduplication logic in MVP.                      |
