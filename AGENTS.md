# AGENTS.md

## Project Overview

AskDoc is an AI-powered document Q&A application that lets users upload PDF documents and ask natural language questions about their contents. The system uses RAG (Retrieval Augmented Generation) with vector search to retrieve relevant document sections and generate grounded, cited answers using Google Gemini.

**Tech Stack:**
- Framework: Next.js 16 (App Router)
- UI: Tailwind CSS + shadcn/ui
- Auth: Better Auth (Google OAuth + credentials) - planned
- Database: Supabase (PostgreSQL + pgvector) - planned
- AI: Google Gemini 2.5 Flash + text-embedding-004 via Vercel AI SDK
- PDF Processing: pdfjs-dist (server-side)
- ORM: Drizzle ORM - planned

## Setup Commands

- Install dependencies: `npm install`
- Start development server: `npm run dev`
- Build for production: `npm run build`
- Start production server: `npm start`

## Project Structure

```
/
├── app/                          # Next.js App Router pages
│   ├── page.tsx                  # Landing page
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles
├── components/
│   └── ui/                       # shadcn/ui components
├── lib/
│   └── utils.ts                 # Utility functions (cn, etc.)
├── public/                      # Static assets
├── docs/planning/               # Project documentation
├── package.json
├── next.config.ts
├── tsconfig.json
└── tailwind.config.ts           # See postcss.config.mjs for v4 config
```

## Development Workflow

- Run `npm run dev` to start the development server at `http://localhost:3000`
- The app uses Next.js 16 - check `node_modules/next/dist/docs/` for breaking changes
- shadcn/ui components are installed - use `npx shadcn@latest add <component>` to add more
- Tailwind CSS v4 is used (configured in `postcss.config.mjs`)

## Code Style

- Use `lib/utils.ts` for the `cn()` utility for conditional class merging
- Follow shadcn/ui component patterns found in `components/ui/`
- Use TypeScript throughout
- Component files use `.tsx` extension, utilities use `.ts`

## Planned Architecture (Not Yet Implemented)

The following are defined in the PRD but not yet built:

### Database Schema (Drizzle ORM + pgvector)
- `documents` - user-uploaded PDFs with status tracking
- `document_chunks` - text chunks with pgvector embeddings
- `conversations` - per-document conversation threads
- `messages` - chat messages with source citations

### API Routes (Elysia.js in Next.js route handlers)
- `POST /api/documents/upload` - upload PDF, trigger processing
- `GET /api/documents` - list user's documents
- `GET /api/documents/:id` - get single document
- `DELETE /api/documents/:id` - delete document + chunks
- `POST /api/documents/:id/chat` - send message, stream response
- `GET /api/documents/:id/conversations` - get conversation history

### RAG Pipeline
1. PDF text extraction via pdfjs-dist
2. Chunking into ~500 token segments with 50 token overlap
3. Embedding generation via text-embedding-004
4. Storage in pgvector

### Required Environment Variables (not yet created)
```
GOOGLE_GENERATIVE_AI_API_KEY=<key>
SUPABASE_SERVICE_ROLE_KEY=<key>
BETTER_AUTH_SECRET=<secret>
NEXT_PUBLIC_SUPABASE_URL=<url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<key>
```

## Current Implementation Status

- Basic Next.js 16 app setup with Tailwind v4
- shadcn/ui components installed (~40+ components)
- Landing page at `app/page.tsx`
- No authentication implemented yet
- No database schema or API routes
- No document processing pipeline
- No chat interface

## Additional Notes

- Max PDF file size: 20MB (per PRD)
- Chunk size: 500 tokens with 50 token overlap
- Similarity threshold for retrieval: 0.75
- Top-k chunks per query: 5
- Context includes last 6 conversation messages
- Test documents and eval results go in `/evals/` directory