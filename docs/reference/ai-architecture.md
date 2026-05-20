# AI Architecture Reference

This document provides complete technical reference for the AI and Retrieval Augmented Generation (RAG) system in AskDoc.

## Architecture Overview

The AI system implements a full RAG pipeline that enables users to chat with their uploaded PDF documents. The system uses Google's Gemini models for both text generation and embeddings, with vector similarity search for retrieval.

```
┌─────────────┐     ┌─────────────────┐     ┌─────────────┐
│  Client    │────▶│  AI Chat API   │────▶│  Gemini    │
│  (React)   │     │  (routers/ai.ts)│     │  (Generate)│
└─────────────┘     └────────┬────────┘     └─────────────┘
                             │
                    ┌────────┴────────┐
                    ▼                 ▼
            ┌─────────────┐    ┌─────────────┐
            │ Embeddings  │    │ Retrieval   │
            │ Router      │    │ Function    │
            └──────┬──────┘    └──────┬──────┘
                   │                   │
                   ▼                   ▼
            ┌─────────────┐     ┌─────────────┐
            │ Gemini      │     │ Vector      │
            │ (Embed)     │     │ Search      │
            └─────────────┘     └──────┬──────┘
                                        │
                                        ▼
                                 ┌─────────────┐
                                 │ PostgreSQL  │
                                 │ (pgvector) │
                                 └─────────────┘
```

## Components

### Core AI Router (`routers/ai.ts`)

The main AI chat endpoint that handles conversation streaming.

| File | Description |
| ---- |-------------|
| `routers/ai.ts` | AI chat API endpoint with tool-based retrieval |

**Endpoint:** `POST /api/ai/chat`

**Request Body:**

```typescript
{
  messages: UIMessage[];      // Chat message history
  documentId: string;          // Target document ID
  conversationId: string;     // Conversation thread ID
}
```

**Response:** Streaming response with `UIMessage` objects.

**Features:**
- Tool-based retrieval using `getInformation` tool
- Step limiting (max 5 steps per request)
- Source citation via `source-url` messages
- Error handling for quota (429) and upstream errors (502)

### Embeddings Router (`routers/embeddings.ts`)

Handles embedding generation for both document chunks and queries.

| File | Description |
| ---- |-------------|
| `routers/embeddings.ts` | Embedding generation endpoints |

**Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/embeddings/chunks` | Generate embeddings for document chunks |
| POST | `/api/embeddings/query` | Generate embedding for user query |

#### POST /embeddings/chunks

**Request Body:**

```typescript
{
  chunks: {
    pageContent: string;
    metadata: Record<string, any>;
  }[];
}
```

**Response:**

```typescript
{
  pageContent: string;
  metadata: Record<string, any>;
  embedding: number[];  // 768-dimensional vector
}[]
```

#### POST /embeddings/query

**Request Body:**

```typescript
{
  query: string;
}
```

**Response:** `number[]` - 768-dimensional embedding vector

### Embedding Functions (`lib/embeddings.ts`)

Client-side utilities for creating embeddings.

| Function | Description |
| -------- |-------------|
| `createChunkEmbeddings` | Generate embeddings for multiple document chunks |
| `createQueryEmbedding` | Generate embedding for a search query |

**Implementation:**

```typescript
const embeddingModel = google.embeddingModel("gemini-embedding-001");
const { embeddings } = await embedMany({
  model: embeddingModel,
  values: mappedChunks,
  providerOptions: {
    google: {
      outputDimensionality: 768,
    },
  },
});
```

### Retrieval (`lib/retrieval.ts`)

Searches the vector database for relevant document chunks.

```typescript
retrieveInformation(embedding: number[], documentId?: string)
```

**Behavior:**
- If `documentId` provided: searches only that document's chunks
- If no `documentId`: searches all user-accessible chunks
- Returns top 5 most similar chunks (similarity > 0.5)

### Document Chunking (`lib/document-chunks.ts`)

Splits uploaded PDFs into processable text chunks.

```typescript
chunkDocument(file: File): Promise<{ data: Document[] | null; error: string | null }>
```

**Configuration:**

| Parameter | Value | Description |
|-----------|-------|-------------|
| `chunkSize` | 500 | Characters per chunk |
| `chunkOverlap` | 50 | Overlap between chunks |
| `loader` | WebPDFLoader | PDF text extraction |

**Process:**
1. Load PDF using `WebPDFLoader` with pdfjs-dist
2. Split text using `RecursiveCharacterTextSplitter`
3. Return array of `Document` objects

### Database Functions (`functions/document-chunks.ts`)

Database operations for vector storage and search.

| Function | Description |
| -------- |-------------|
| `createDocumentChunk` | Insert chunk with embedding into database |
| `getSimilarDocumentChunksByDocumentId` | Search within specific document |
| `getSimilarDocumentChunks` | Global search across all documents |

**Similarity Calculation:**

```typescript
const similarity = sql<number>`1 - (${cosineDistance(documentChunk.embedding, embedding)})`;
```

Uses cosine distance for semantic similarity.

## Database Schema

### document_chunk Table

Defined in `db/schema.ts`.

```typescript
export const documentChunk = pgTable(
  "document_chunk",
  {
    id: text("id").primaryKey(),
    content: text("content").notNull(),
    pageNumbers: integer("page_numbers").array(),
    chunkIndex: integer("chunk_index").notNull(),
    lineFrom: integer("line_from"),
    lineTo: integer("line_to"),
    embedding: vector("embedding", { dimensions: 768 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
    documentId: text("document_id")
      .references(() => document.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => [
    index("document_chunk_embedding_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops"),
    ),
  ],
);
```

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | text | primaryKey | Unique chunk identifier |
| `content` | text | notNull | Text content of chunk |
| `pageNumbers` | integer[] | nullable | Source page numbers |
| `chunkIndex` | integer | notNull | Position in document |
| `lineFrom` | integer | nullable | Starting line number |
| `lineTo` | integer | nullable | Ending line number |
| `embedding` | vector(768) | notNull | Gemini embedding vector |
| `createdAt` | timestamp | notNull | Creation timestamp |
| `updatedAt` | timestamp | notNull | Last update timestamp |
| `documentId` | text | notNull, foreignKey | Parent document |

**Indexes:**

- `document_chunk_embedding_idx` - HNSW index on embedding for fast similarity search

## RAG Pipeline Workflow

### Document Upload and Indexing

```
User uploads PDF
       │
       ▼
┌─────────────────┐
│ Document Router │──▶ Store file in Supabase Storage
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ chunkDocument   │──▶ Extract text, split into chunks
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Embeddings      │──▶ Generate 768-dim embeddings
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Database        │──▶ Store chunks with embeddings
└─────────────────┘
```

### Chat Interaction

```
User sends message
       │
       ▼
┌─────────────────┐
│ AI Router       │──▶ Load system prompt from prompts/chat.md
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Gemini (LLM)    │──▶ Process message, invoke getInformation tool
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Query Embedding │──▶ Convert user question to vector
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Vector Search   │──▶ Find similar chunks (cosine similarity > 0.5)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Gemini (LLM)    │──▶ Generate answer grounded in retrieved context
└────────┬────────┘
         │
         ▼
Streaming response to client
```

### Tool Definition

The `getInformation` tool enables the LLM to retrieve relevant context:

```typescript
getInformation: tool({
  description: "Get relevant information from the knowledge base based on the question and document ID.",
  inputSchema: z.object({
    question: z.string(),
  }),
  execute: async ({ question }) => {
    // 1. Create query embedding
    // 2. Search vector database
    // 3. Return formatted sources
  },
})
```

## Configuration

### Model Configuration

| Parameter | Value | Description |
|-----------|-------|-------------|
| Generation Model | `google/gemini-3.1-flash-lite` | Text generation |
| Embedding Model | `gemini-embedding-001` | Vector generation |
| Embedding Dimensions | 768 | Vector size |
| Max Steps | 5 | Tool invocation limit |
| Similarity Threshold | 0.5 | Minimum cosine similarity |
| Top-K Results | 5 | Maximum chunks retrieved |

### System Prompt

Loaded from `prompts/chat.md`:

```markdown
You are a helpful assistant. Check your knowledge base before answering any questions.

## Rules
1. Ground every claim in the provided context.
2. Cite every factual claim with the node ID in square brackets.
3. If the context is insufficient, acknowledge the gap.
4. Structure longer responses with clear paragraphs.
```

## Error Handling

| Status Code | Condition | Message |
|------------|-----------|---------|
| 429 | Rate limit exceeded | "Quota reached. Please try again later." |
| 502 | Upstream AI failure | "Upstream AI error." |
| 500 | Unexpected error | "Unexpected error." |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_GENERATIVE_API_KEY` | Yes | API key for Gemini models |

## Related Files

### File Structure

```
routers/
├── ai.ts                    # AI chat endpoint
└── embeddings.ts            # Embedding generation endpoints

lib/
├── embeddings.ts            # Client-side embedding utilities
├── retrieval.ts             # Vector search function
├── document-chunks.ts       # PDF chunking
└── prompt.ts                # Prompt loading

functions/
└── document-chunks.ts       # Database operations

prompts/
└── chat.md                  # System prompt template

db/
└── schema.ts                # document_chunk table definition
```

### Dependencies

| Package | Purpose |
|---------|---------|
| `ai` | Vercel AI SDK for streaming and tool calling |
| `@ai-sdk/google` | Google Gemini provider |
| `@langchain/community` | PDF loading (WebPDFLoader) |
| `@langchain/textsplitters` | Text chunking (RecursiveCharacterTextSplitter) |
| `drizzle-orm` | Database ORM |
| `pgvector` | Vector storage in PostgreSQL |

## Extending the System

### Adding New Retrieval Strategies

Modify `lib/retrieval.ts` to implement different search algorithms:

```typescript
export const retrieveInformation = async (
  embedding: number[],
  documentId?: string,
) => {
  // Implement hybrid search,BM25, or reranking
};
```

### Changing Embedding Model

Update embedding configuration in both `lib/embeddings.ts` and `routers/embeddings.ts`:

```typescript
const embeddingModel = google.embeddingModel("gemini-embedding-001");
// Replace with: google.embeddingModel("text-embedding-004");
```

### Adjusting Retrieval Parameters

Modify constants in `functions/document-chunks.ts`:

```typescript
// Change similarity threshold
.where(gt(similarity, 0.5))  // Increase for stricter matching

// Change top-k results
.limit(5)  // Increase for more context
```

### Adding New Tools

Extend the tools object in `routers/ai.ts`:

```typescript
tools: {
  getInformation: tool({...}),
  // Add new tool
  searchWeb: tool({
    description: "Search the web for current information",
    inputSchema: z.object({ query: z.string() }),
    execute: async ({ query }) => { ... },
  }),
}
```