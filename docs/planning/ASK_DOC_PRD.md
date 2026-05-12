# AskDoc — Product Requirements Document

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

#### Auth

**Story:** As a user, I want to sign in with Google or email/password so that my documents are private to my account.

**Acceptance Criteria:**

- Google OAuth and credentials-based login both work via Better Auth
- Unauthenticated users are redirected to the login page
- Sessions persist across browser refreshes

---

#### Document Upload

**Story:** As a user, I want to upload a PDF so that I can ask questions about its contents.

**Acceptance Criteria:**

- Accepts PDF files only; rejects other formats with a clear error message
- Maximum file size: 20MB. Files exceeding this are rejected before upload begins
- Upload progress is visible to the user
- On successful upload, processing begins automatically — the user sees a "Processing..." status indicator
- If processing fails, the user sees a specific error ("Could not extract text from this PDF") and the document is not saved
- A document record is created in the database only after processing succeeds

---

#### Document Processing Pipeline

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

#### Document Management

**Story:** As a user, I want to see all my uploaded documents and delete ones I no longer need.

**Acceptance Criteria:**

- Documents list page shows: filename, upload date, page count, status (`processing` / `ready` / `error`)
- Documents with `error` status display a retry or delete option
- Deleting a document removes the file from Supabase Storage, all associated chunks from the DB, and all associated conversations
- Users can only see and act on their own documents (ownership enforced server-side)

---

#### Q&A Chat

**Story:** As a user, I want to ask natural language questions about a document and receive answers with source references.

**Acceptance Criteria:**

- Chat interface is scoped to a single document per session
- User types a question and submits; the AI response streams word-by-word into the UI
- Each answer includes source citations: chunk excerpt + page number
- Citations are displayed below the answer as collapsible reference cards
- If no relevant chunks are found (similarity score below threshold), the system responds: "I couldn't find relevant information in this document for that question." — it does not fabricate an answer
- Users can ask follow-up questions; the last 6 messages are included in the LLM context window
- A user can have multiple conversations per document; previous conversations are accessible in a sidebar
- User can start a new conversation at any time without losing prior ones
- Conversations are listed in the sidebar by auto-generated title (derived from first message) and creation date
- User can delete a conversation; all its messages are removed
- Conversation history is persisted across sessions

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

1. Extract raw text from PDF using LangChain `PDFLoader` (per-page, server-side)
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

| Layer                     | Technology                                                                         |
| ------------------------- | ---------------------------------------------------------------------------------- |
| Framework                 | Next.js 15 (App Router)                                                            |
| Backend                   | Elysia.js as Next.js route handler (`app/api/[[...slugs]]/route.ts`)               |
| Auth                      | Better Auth (Google OAuth + credentials)                                           |
| Database                  | Supabase (PostgreSQL + pgvector)                                                   |
| ORM                       | Drizzle ORM                                                                        |
| API Client                | Eden Treaty (type-safe)                                                            |
| AI SDK                    | Vercel AI SDK                                                                      |
| LLM                       | Google Gemini 2.5 Flash                                                            |
| Embeddings                | Google `gemini-embedding-001`                                                      |
| File Storage              | Supabase Storage                                                                   |
| PDF Extraction & Chunking | LangChain (`@langchain/community` WebPDFLoader + `RecursiveCharacterTextSplitter`) |
| Styling                   | Tailwind CSS + shadcn/ui                                                           |

### Repo Structure

```
/
├── app/                          # Next.js App Router pages
│   ├── (app)/                    # Protected routes group
│   │   ├── documents/            # Documents page
│   │   │   └── page.tsx
│   │   └── layout.tsx            # App layout
│   ├── (auth)/                  # Auth routes group
│   │   ├── login/               # Login page
│   │   │   └── page.tsx
│   │   ├── register/           # Register page
│   │   │   └── page.tsx
│   │   └── layout.tsx          # Auth layout
│   ├── api/                     # API gateway (Next.js to Elysia)
│   │   ├── [[...slugs]]/        # Catches all non-auth API routes
│   │   │   └── route.ts
│   │   └── auth/
│   │       └── [...all]/route.ts # Better Auth routes
│   ├── page.tsx                  # Landing page (public)
│   ├── layout.tsx               # Root layout
│   └── globals.css              # Global styles
├── components/
│   ├── ui/                      # shadcn/ui components
│   └── documents/               # Document-related components
├── constants/                   # App constants
│   └── index.ts
├── db/                          # Database layer
│   ├── index.ts                 # DB instance
│   └── schema.ts               # Drizzle schema
├── functions/                   # Business logic functions (actual database queries and operations)
│   ├── documents.ts
│   ├── conversations.ts
│   ├── messages.ts
│   └── document-chunks.ts
├── lib/                         # Utilities and helpers
│   ├── auth.ts                 # Server-side auth (Better Auth)
│   ├── auth-client.ts          # Client-side auth client
│   ├── api.ts                  # Eden treaty client
│   ├── documents.ts            # Document processing functions (text extraction, chunking, embedding)
│   ├── document-chunks.ts      # Document chunking and embedding functions
│   ├── elyssia.ts              # Elysia app definition
│   ├── supabase.ts             # Supabase client factory
│   ├── schemas/                # Zod validation schemas
│   │   └── auth.ts
│   └── utils.ts                # Utility functions (cn, etc.)
├── routers/                     # Elysia route definitions
│   ├── health.ts
│   ├── embeddings.ts
│   └── documents/
│       ├── index.ts
│       ├── conversations.ts
│       ├── messages.ts
│       └── document-chunks.ts
├── hooks/                      # Custom React hooks
│   └── use-mobile.ts
├── drizzle/                    # Drizzle config & migrations
│   ├── meta/
│   └── config.ts
├── tests/                      # Test files
│   └── api/
│       └── eden.test.ts
├── docs/planning/              # Project documentation
├── package.json
├── next.config.ts
├── tsconfig.json
└── tailwind.config.ts         # See postcss.config.mjs for v4 config
```

### Database Schema

```ts
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
| `POST`   | `/api/documents`                   | Upload PDF, trigger processing            |
| `GET`    | `/api/documents`                   | List user's documents                     |
| `GET`    | `/api/documents/:id`               | Get single document + status              |
| `DELETE` | `/api/documents/:id`               | Delete document + chunks + storage        |
| `POST`   | `/api/documents/:id/conversations` | Create a new conversation for a document  |
| `GET`    | `/api/documents/:id/conversations` | List all conversations for a document     |
| `DELETE` | `/api/conversations/:id`           | Delete a conversation + its messages      |
| `POST`   | `/api/conversations/:id/messages`  | Send message, stream response + citations |
| `GET`    | `/api/conversations/:id/messages`  | Get all messages for a conversation       |

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

### Future Versions (Post-MVP)

**v1.1**

- Multiple documents per session ("ask about Document A or B")
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

| Decision                         | Resolution                                                                                                                                                      |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Conversation history persistence | Multiple conversations per document per user. Each conversation is persisted across sessions. Conversations are listed in a sidebar with auto-generated titles. |
| Chunk size configurability       | Fixed for MVP — 500 tokens per chunk, 50-token overlap. Not user-configurable.                                                                                  |
| Duplicate document uploads       | Treated as a new document each time. No deduplication logic in MVP.                                                                                             |

---

## 7. MVP Development Phases

The MVP is broken into 6 sequential phases. Each phase has a clear scope, granular task list, and exit conditions that must pass before moving to the next phase.

---

### Phase 1 — Foundation & Auth

**Goal:** Working Next.js app with authentication, protected routing, and Supabase connected.

**Tasks:**

- [ ] Scaffold Next.js 15 project with App Router, TypeScript, Tailwind CSS, shadcn/ui
- [ ] Install and configure Better Auth with Google OAuth and credentials provider
- [ ] Create Supabase project; add connection string to environment variables
- [ ] Install and configure Drizzle ORM; connect to Supabase
- [ ] Create initial Drizzle schema for `users` and `sessions` (Better Auth tables)
- [ ] Run initial migration
- [ ] Implement login page (`/login`) with Google OAuth button and email/password form
- [ ] Implement protected layout — unauthenticated users redirect to `/login`
- [ ] Implement sign out
- [ ] Set up Elysia.js as a Next.js route handler at `app/api/[[...slugs]]/route.ts`
- [ ] Add a health check route `GET /api/health` returning `{ status: "ok" }`
- [ ] Set up Eden Treaty client in `lib/api.ts`

**Exit Conditions:**

- [ ] User can sign in with Google and email/password
- [ ] Authenticated user lands on `/documents`; unauthenticated user is redirected to `/login`
- [ ] Sign out clears the session and redirects to `/login`
- [ ] `GET /api/health` returns 200
- [ ] No TypeScript errors; app builds cleanly

---

### Phase 2 — Database Schema & API Layer

**Goal:** Full database schema in place with all Elysia routes stubbed, validated, and returning correct shapes.

**Tasks:**

- [ ] Enable pgvector extension in Supabase (`CREATE EXTENSION IF NOT EXISTS vector`)
- [ ] Extend Drizzle schema: `documents`, `document_chunks` (with vector column), `conversations`, `messages`
- [ ] Run migration; verify all tables and the vector column exist in Supabase
- [ ] Create private Supabase Storage bucket named `documents`
- [ ] Implement all Elysia document routes with TypeBox validation:
  - `POST /api/documents/upload` — stub, returns `{ id, status: "processing" }`
  - `GET /api/documents` — returns empty array for now
  - `GET /api/documents/:id` — returns `404` if not found or not owned by user
  - `DELETE /api/documents/:id` — returns `404` if not found or not owned by user
- [ ] Implement all Elysia conversation + message routes stubbed:
  - `POST /api/documents/:id/conversations` — returns `{ id, title: null, createdAt }`
  - `GET /api/documents/:id/conversations` — returns empty array
  - `DELETE /api/conversations/:id` — returns `404` if not found or not owned by user
  - `POST /api/conversations/:id/messages` — returns placeholder streamed text response
  - `GET /api/conversations/:id/messages` — returns empty array
- [ ] All routes verify session; unauthenticated requests return `401`
- [ ] All routes return `404` (not `403`) for resources not owned by the requesting user

**Exit Conditions:**

- [ ] Migration runs cleanly; all tables visible in Supabase dashboard including `embedding vector(768)` column
- [ ] All routes respond with correct status codes and shapes when tested manually (Hoppscotch or curl)
- [ ] Unauthenticated requests to any route return `401`
- [ ] Requesting another user's resource returns `404`
- [ ] No TypeScript errors; app builds cleanly

---

### Phase 3 — Document Upload & Processing Pipeline

**Goal:** User can upload a PDF. The system extracts text, chunks it, generates embeddings, and stores them in pgvector. Document status reflects the processing state in real time.

**Tasks:**

- [ ] Install `@langchain/community` and `langchain` for PDF loading and text splitting
- [ ] Implement `lib/ingest.ts` — load a PDF buffer using LangChain's `PDFLoader` with `splitPages: true`, then split into ~500-token chunks with 50-token overlap using `RecursiveCharacterTextSplitter`; preserve `loc.pageNumber` metadata per chunk; return `{ content, pageNumbers, chunkIndex }[]`
- [ ] Implement `lib/embeddings.ts` — generate embeddings for an array of strings using `text-embedding-004` via Google AI SDK; return `number[][]`
- [ ] Wire up `POST /api/documents/upload`:
  - Accept `multipart/form-data` with a PDF file
  - Validate: PDF only, max 20MB (server-side MIME check)
  - Upload raw file to Supabase Storage at `documents/{userId}/{documentId}.pdf`
  - Insert document record with `status: "processing"`
  - Return `{ id, status: "processing" }` immediately
  - Trigger processing pipeline asynchronously (do not await in the request handler)
- [ ] Implement async processing pipeline (called after upload response):
  1. Fetch file buffer from Supabase Storage
  2. Extract and chunk text via `lib/ingest.ts`
  3. If no chunks produced, update status to `error` with message "Could not extract text — this may be a scanned PDF" and exit
  4. Generate embeddings via `lib/embeddings.ts`
  5. Batch insert all chunks + embeddings into `document_chunks`
  6. Update document `status` to `ready`, set `pageCount`
  7. On any unhandled error: update status to `error` with error message
- [ ] Implement `GET /api/documents` — return user's documents with `id`, `filename`, `status`, `pageCount`, `createdAt`
- [ ] Implement `GET /api/documents/:id` — return single document record
- [ ] Implement `DELETE /api/documents/:id`:
  - Delete file from Supabase Storage
  - Delete all `document_chunks` for this document
  - Delete all `conversations` and `messages` for this document
  - Delete the `documents` record
- [ ] Build documents list page (`/documents`):
  - Shows filename, upload date, page count, status badge
  - Upload button opens a file picker (PDF only)
  - Polls `GET /api/documents/:id` every 3 seconds while status is `processing`
  - Status badge updates to `ready` or `error` without page reload
  - Delete button with confirmation dialog

**Exit Conditions:**

- [ ] Uploading a valid PDF creates a document record and triggers processing
- [ ] After processing, `status` is `ready` and `document_chunks` rows exist in the DB with non-null embeddings
- [ ] Uploading a non-PDF or a file over 20MB returns a clear error; no record is created
- [ ] Uploading a scanned/image-only PDF sets status to `error` with the appropriate message
- [ ] Deleting a document removes the file, all chunks, and all conversations from the DB
- [ ] Status badge on the documents list page updates in real time without a full page reload
- [ ] No TypeScript errors; app builds cleanly

---

### Phase 4 — RAG Query Engine

**Goal:** User can ask questions about a document and receive streamed, cited answers grounded in the document's content.

**Tasks:**

- [ ] Implement `lib/retrieval.ts`:
  - Generate embedding for the user's query
  - Run cosine similarity search against `document_chunks` for the given `documentId`
  - Return top-5 chunks with similarity score ≥ 0.75
  - Return empty array (no hallucination) if no chunks meet the threshold
- [ ] Wire up `POST /api/documents/:id/conversations`:
  - Create a new `conversations` record with `title: null`
  - Return `{ id, title, createdAt }`
- [ ] Wire up `GET /api/documents/:id/conversations`:
  - Return all conversations for this document owned by the user
  - Include `id`, `title`, `createdAt` per conversation
- [ ] Wire up `DELETE /api/conversations/:id`:
  - Verify ownership; return `404` if not found or not owned
  - Delete all messages in the conversation, then the conversation record
- [ ] Wire up `POST /api/conversations/:id/messages`:
  - Validate request body: `{ message: string }`
  - Verify conversation ownership; return `404` if not found or not owned
  - Retrieve parent `documentId` from the conversation record
  - Retrieve top-5 chunks via `lib/retrieval.ts`
  - If no chunks found, stream back the refusal message without calling Gemini
  - Construct prompt: system prompt + retrieved chunks as context + last 6 messages from this conversation
  - Stream response from Gemini 2.5 Flash via Vercel AI SDK
  - On stream completion:
    - Persist user message + assistant message (with `sourceChunkIds`) to `messages` table
    - If conversation `title` is still null, generate a short title from the first user message (5 words max) and update the conversation record
  - Return streaming response + `sourceChunkIds` as a stream event
- [ ] Wire up `GET /api/conversations/:id/messages`:
  - Verify ownership; return `404` if not found or not owned
  - Return all messages ordered by `createdAt` ascending
- [ ] Build chat UI (`/documents/[id]`):
  - Two-panel layout: left sidebar (conversation list) + right main area (active chat)
  - Sidebar lists all conversations for the document with title and creation date; most recent first
  - "New conversation" button in sidebar creates a new conversation and activates it
  - Clicking a conversation in the sidebar loads its messages into the main area
  - Active conversation highlighted in sidebar
  - Delete button per conversation in sidebar with confirmation
  - Message input + send button in main area
  - Streamed assistant response renders word-by-word
  - Source citation cards displayed below each assistant message (chunk excerpt + page number)
  - Citation cards are collapsible
  - Refusal message displayed inline (no citation cards)
  - Loading state while awaiting first stream token
  - If no conversations exist yet, one is created automatically on page load

**Exit Conditions:**

- [ ] Asking a question covered by the document returns a streamed answer with at least one citation
- [ ] Asking a question not covered by the document returns the refusal message with no citations
- [ ] Citations reference real chunks — verified manually against the source PDF
- [ ] Creating a new conversation appears immediately in the sidebar
- [ ] Switching between conversations loads the correct message history
- [ ] Deleting a conversation removes it from the sidebar and its messages from the DB
- [ ] Conversation title auto-generates from the first message and appears in the sidebar
- [ ] Follow-up questions in the same conversation maintain context from prior messages
- [ ] No TypeScript errors; app builds cleanly

---

### Phase 5 — UI Polish & Edge Cases

**Goal:** All user-facing flows are complete, error states are handled, and the app is presentable as a portfolio piece.

**Tasks:**

- [ ] Empty state on documents list page ("No documents yet — upload your first PDF")
- [ ] Empty state in chat main area when a brand new conversation has no messages yet
- [ ] Error state on documents list for documents with `status: "error"` (message + delete option)
- [ ] Disable chat input while document is still `processing`
- [ ] Handle network errors on upload (retry prompt)
- [ ] Handle Gemini rate limit errors gracefully (user-facing message, not a crash)
- [ ] Disable send button while a response is streaming
- [ ] Add a loading skeleton to the documents list page and conversation sidebar
- [ ] Add page title and meta tags
- [ ] Responsive layout — usable on tablet and desktop
- [ ] Smooth scroll to latest message in chat
- [ ] Truncate long conversation titles in sidebar to a single line

**Exit Conditions:**

- [ ] All empty and error states render correctly
- [ ] No unhandled promise rejections or console errors in normal usage flows
- [ ] App is usable on a 768px-wide viewport
- [ ] Upload, processing, chatting, conversation switching, and deletion flows all work end-to-end without a page reload

---

### Phase 6 — Evals & Deployment

**Goal:** AI output quality is measured and documented. App is live and the codebase is portfolio-ready.

**Tasks:**

- [ ] Create `/evals/` directory in the repo
- [ ] Select 2 test documents: one short (~10 pages), one long (~50 pages)
- [ ] Write 20 test questions per document (10 answerable, 10 unanswerable)
- [ ] Create `evals/run.ts` — a script that sends each question to the chat API and logs the response + cited chunks to a JSON file
- [ ] Manually score results against the eval criteria (citation accuracy ≥ 90%, hallucination rate 0%, refusal accuracy 100%)
- [ ] Save results to `evals/results-v1.json`
- [ ] Tune similarity threshold or prompt if scores fall below target; re-run and save new results
- [ ] Write `README.md` covering: what the project is, the RAG architecture, tech stack, how to run locally, eval results summary
- [ ] Deploy to Railway (backend) or Vercel (full app); confirm production environment variables are set
- [ ] Smoke test all flows in production

**Exit Conditions:**

- [ ] Eval results meet targets: citation accuracy ≥ 90%, hallucination rate 0%, refusal accuracy 100%
- [ ] `evals/results-v1.json` committed to the repo
- [ ] `README.md` written and covers architecture decisions
- [ ] App is live and accessible via a public URL
- [ ] All six phases' exit conditions remain passing in production
