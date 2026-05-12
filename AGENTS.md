# AGENTS.md

## Project Overview

AskDoc is an AI-powered document Q&A application that lets users upload PDF documents and ask natural language questions about their contents. The system uses RAG (Retrieval Augmented Generation) with vector search to retrieve relevant document sections and generate grounded, cited answers using Google Gemini.

**Tech Stack:**

- Framework: Next.js 16.2.4 (App Router)
- UI: Tailwind CSS v4 + shadcn/ui
- Auth: Better Auth 1.6.9 (Google OAuth + credentials)
- Database: Supabase (PostgreSQL)
- ORM: Drizzle ORM 0.45.2
- Backend API: Elysia (REST API framework)
- API Client: Eden Treaty (typed API client for Elysia)
- AI: Google Gemini 2.5 Flash
- PDF Processing: pdfjs-dist + pdf-parse
- Validation: Zod 4.4.3

## Setup Commands

Always use `bun` for package management and scripts.

- Install dependencies: `bun install`
- Start development server: `bun run dev`
- Build for production: `bun run build`
- Start production server: `bun run start`
- Generate db migrations: `bun run db:generate`
- Push db schema: `bun run db:push`
- Pull db schema: `bun run db:pull`
- Run tests: `bun run test`
- Run unit tests: `bun run test:unit`

## Project Structure

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

## Development Workflow

- Run `bun run dev` to start the development server at `http://localhost:3000`
- The app uses Next.js 16 - check `node_modules/next/dist/docs/` for breaking changes
- shadcn/ui components are installed - use `bunx shadcn@latest add <component>` to add more
- Tailwind CSS v4 is used (configured in `postcss.config.mjs`)

## Code Style

- Use `lib/utils.ts` for the `cn()` utility for conditional class merging
- Follow shadcn/ui component patterns found in `components/ui/`
- Use TypeScript throughout
- Component files use `.tsx` extension, utilities use `.ts`

## API Patterns (Eden Treaty)

The project uses Elysia for the backend API and Eden Treaty for type-safe API calls.

### Client Usage Pattern

Import the client from `lib/api`:

```typescript
import { client } from "@/lib/api";
```

### Making API Calls

Eden Treaty returns `{ data, error }` pattern:

```typescript
// Server Components - pass cookies for auth
const incoming = await headers();
const cookieHeader = incoming.get("cookie") ?? "";
const { data, error } = await client.documents.get({
  fetch: {
    headers: { cookie: cookieHeader },
  },
});

// Client Components - no extra headers needed
const { data, error } = await client.documents.post({ file });

// Accessing data and error
if (error) {
  console.error(error.value.message);
  return;
}
// Use data here
```

### Nested Routes

Use method chaining for nested routes:

```typescript
// GET /api/documents/:id
client.documents({ id: "uuid" }).get();

// POST /api/documents/:id/conversations
client.documents({ id: "uuid" }).conversations.post();

// PATCH /api/documents/:id
client.documents({ id: "uuid" }).patch({ status: "ready" });
```

### Error Handling

Errors are returned in the `error` property with structure `{ value: { message: string } }`:

```typescript
if (error) {
  const message = error.value.message;
  setError(message);
  return;
}
```

## Implemented Features

### Authentication (Better Auth)

- Email/password authentication with sign-in and sign-up
- Google OAuth provider configured
- Server-side auth in `lib/auth.ts` using `better-auth`
- Client-side auth client in `lib/auth-client.ts` using `better-auth/react`
- Auth validation schemas in `lib/schemas/auth.ts`
- Protected dashboard route at `/documents`

### Database Schema (Drizzle ORM)

- `user` - User accounts with email, name, image
- `session` - Active user sessions
- `account` - OAuth + password accounts
- `verification` - Email verification tokens
- `document` - User-uploaded PDFs with status tracking
- `document_chunk` - Text chunks with pgvector embeddings (768 dimensions)
- `conversation` - Per-document conversation threads
- `message` - Chat messages with source citations
- All tables use Supabase (PostgreSQL) database

### API Routes (Elysia)

- `GET /api/health` - Health check
- `GET /api/documents` - List user's documents
- `POST /api/documents` - Upload new document
- `GET /api/documents/:id` - Get single document
- `PATCH /api/documents/:id` - Update document
- `DELETE /api/documents/:id` - Delete document + chunks
- `GET /api/documents/:id/conversations` - Get document conversation
- `POST /api/documents/:id/messages` - Create chat message
- `POST /api/documents/:id/chunks` - Save document chunks
- `POST /api/embeddings` - Generate embeddings for chunks

### RAG Pipeline (Implemented)

1. PDF text extraction via pdfjs-dist
2. Chunking via RecursiveCharacterTextSplitter (500 chars, 50 char overlap)
3. Embedding generation via text-embedding-004
4. Storage in pgvector with HNSW index

## Required Environment Variables

```
DATABASE_URL=<neon-postgres-connection-string>
NEXT_PUBLIC_SUPABASE_URL=<supabase-project-url>
SUPABASE_SERVICE_ROLE_KEY=<supabase-service-role-key>
GOOGLE_CLIENT_ID=<google-oauth-client-id>
GOOGLE_CLIENT_SECRET=<google-oauth-client-secret>
BETTER_AUTH_SECRET=<auth-secret>
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Additional Notes

- Max PDF file size: 20MB
- Chunk size: 500 characters with 50 character overlap
- Embedding dimensions: 768 (via text-embedding-004)
- Similarity threshold for retrieval: 0.75
- Top-k chunks per query: 5
- Context includes last 6 conversation messages
- Test documents and eval results go in `/evals/` directory
