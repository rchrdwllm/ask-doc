# AGENTS.md

## Project Overview

AskDoc is an AI-powered document Q&A application that lets users upload PDF documents and ask natural language questions about their contents. The system uses RAG (Retrieval Augmented Generation) with vector search to retrieve relevant document sections and generate grounded, cited answers using Google Gemini.

**Tech Stack:**

- Framework: Next.js 16.2.4 (App Router)
- UI: Tailwind CSS v4 + shadcn/ui
- Auth: Better Auth 1.6.9 (Google OAuth + credentials)
- Database: Supabase (PostgreSQL)
- ORM: Drizzle ORM 0.45.2
- AI: Google Gemini 2.5 Flash - planned
- PDF Processing: pdfjs-dist - planned
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

## Project Structure

```
/
├── app/                          # Next.js App Router pages
│   ├── (app)/                    # Protected routes group
│   │   └── dashboard/            # Protected dashboard
│   │       └── page.tsx
│   ├── (auth)/                  # Auth routes group
│   │   ├── login/               # Login page
│   │   │   └── page.tsx
│   │   ├── register/           # Register page
│   │   │   └── page.tsx
│   │   └── layout.tsx           # Auth layout
│   ├── api/auth/                # Auth API endpoints
│   │   └── [...all]/route.ts
│   ├── page.tsx                  # Landing page (public)
│   ├── layout.tsx               # Root layout
│   └── globals.css              # Global styles
├── components/ui/                # shadcn/ui components (60+)
├── db/                         # Database layer
│   ├── index.ts               # DB instance
│   └── schema.ts             # Drizzle schema
├── lib/                       # Utilities
│   ├── auth.ts               # Server-side auth (Better Auth)
│   ├── auth-client.ts        # Client-side auth client
│   ├── schemas/             # Zod validation schemas
│   │   └── auth.ts
│   └── utils.ts             # Utility functions (cn, etc.)
├── hooks/                    # Custom React hooks
│   └── use-mobile.ts
├── drizzle/                  # Drizzle config & migrations
│   ├── meta/
│   └── config.ts
├── docs/planning/            # Project documentation
├── package.json
├── next.config.ts
├── tsconfig.json
└── tailwind.config.ts       # See postcss.config.mjs for v4 config
```

## Development Workflow

- Run `bun run dev` to start the development server at `http://localhost:3000`
- The app uses Next.js 16 - check `node_modules/next/dist/docs/` for breaking changes
- shadcn/ui components are installed - use `npx shadcn@latest add <component>` to add more
- Tailwind CSS v4 is used (configured in `postcss.config.mjs`)

## Code Style

- Use `lib/utils.ts` for the `cn()` utility for conditional class merging
- Follow shadcn/ui component patterns found in `components/ui/`
- Use TypeScript throughout
- Component files use `.tsx` extension, utilities use `.ts`

## Implemented Features

### Authentication (Better Auth)

- Email/password authentication with sign-in and sign-up
- Google OAuth provider configured
- Server-side auth in `lib/auth.ts` using `better-auth`
- Client-side auth client in `lib/auth-client.ts` using `better-auth/react`
- Auth validation schemas in `lib/schemas/auth.ts`
- Protected dashboard route at `/dashboard`

### Database Schema (Drizzle ORM)

- User table with email, name, image
- Session table for active sessions
- Account table for OAuth + password accounts
- Verification table for email verification
- All tables use Supabase (PostgreSQL) database

### Pages

- Landing page at `/` (public)
- Login page at `/login`
- Register page at `/register`
- Dashboard at `/dashboard` (protected)

## Planned Architecture

The following features are defined in the PRD but not yet built:

### Document Management

- `documents` - user-uploaded PDFs with status tracking
- `document_chunks` - text chunks with pgvector embeddings
- `conversations` - per-document conversation threads
- `messages` - chat messages with source citations

### API Routes

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

### Required Environment Variables

```
DATABASE_URL=<supabase-connection-string>
GOOGLE_CLIENT_ID=<google-oauth-client-id>
GOOGLE_CLIENT_SECRET=<google-oauth-client-secret>
BETTER_AUTH_SECRET=<auth-secret>
BETTER_AUTH_URL=http://localhost:3000
```

## Additional Notes

- Max PDF file size: 20MB (per PRD)
- Chunk size: 500 tokens with 50 token overlap
- Similarity threshold for retrieval: 0.75
- Top-k chunks per query: 5
- Context includes last 6 conversation messages
- Test documents and eval results go in `/evals/` directory
