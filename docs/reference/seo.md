# SEO Reference & How-to Guide

This document covers two things:

- **Reference**: Complete technical reference for the SEO metadata configuration, including constants, page titles, Open Graph tags, sitemap, and robots.txt.
- **How-to Guide**: Step-by-step instructions for adding SEO to new pages, handling both static and dynamic metadata.

---

## Reference: SEO Configuration

### 1. Constants

Defined in `constants/index.ts`.

```typescript
export const APP_NAME = "AskDoc";
export const APP_DESCRIPTION =
  "AI-powered document Q&A — upload PDFs and ask questions.";
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
```

| Constant            | Source                              | Fallback                     |
| ------------------- | ----------------------------------- | ---------------------------- |
| `APP_NAME`          | Hardcoded                           | —                            |
| `APP_DESCRIPTION`   | Hardcoded                           | —                            |
| `APP_URL`           | `NEXT_PUBLIC_APP_URL` env var       | `http://localhost:3000`      |

These are consumed by the root layout, sitemap, and robots files.

### 2. Root Layout Metadata

Defined in `app/layout.tsx`.

```typescript
export const metadata: Metadata = {
  title: {
    template: `%s | ${APP_NAME}`,
    default: APP_NAME,
  },
  description: APP_DESCRIPTION,
  metadataBase: new URL(APP_URL),
  openGraph: {
    title: APP_NAME,
    description: APP_DESCRIPTION,
    url: APP_URL,
    siteName: APP_NAME,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: APP_NAME,
    description: APP_DESCRIPTION,
  },
  icons: {
    icon: "/favicon.ico",
  },
};
```

**Title template behavior:**

| Page `metadata.title`     | Rendered `<title>`            |
| ------------------------- | ----------------------------- |
| `"Sign In"`               | `Sign In \| AskDoc`           |
| *(not set, uses default)* | `AskDoc`                      |
| `"My Documents"`          | `My Documents \| AskDoc`      |
| `"Health Check"`          | `Health Check \| AskDoc`      |

The `metadataBase` is set from `APP_URL` so relative URLs in metadata (like `/favicon.ico`) resolve correctly regardless of deployment environment.

### 3. Per-Page Metadata

Every page in the application exports either a static `metadata` object or a `generateMetadata` function.

#### Static Metadata Pages

| Page                        | File                                                  | Title                   |
| --------------------------- | ----------------------------------------------------- | ----------------------- |
| Landing `/`                 | `app/page.tsx`                                        | *(default: `AskDoc`)*   |
| Login `/login`              | `app/(auth)/login/page.tsx`                           | `Sign In`               |
| Register `/register`        | `app/(auth)/register/page.tsx`                        | `Create Account`        |
| Documents `/documents`      | `app/(app)/documents/page.tsx`                        | `My Documents`          |
| Health `/health`            | `app/health/page.tsx`                                 | `Health Check`          |

The landing page does not export metadata — it inherits the default `APP_NAME` from the root layout template.

#### Dynamic Metadata Pages (generateMetadata)

| Page                                      | File                                                                   | Title source           |
| ----------------------------------------- | ---------------------------------------------------------------------- | ---------------------- |
| Document detail `/documents/[documentId]` | `app/(app)/documents/[documentId]/page.tsx`                            | Document name from API |
| Conversation `/documents/.../conversations/[conversationId]` | `app/(app)/documents/[documentId]/conversations/[conversationId]/page.tsx` | Conversation title from API |

**Document detail page** (`app/(app)/documents/[documentId]/page.tsx`):

```typescript
export async function generateMetadata({
  params,
}: DocumentPageProps): Promise<Metadata> {
  const { documentId } = await params
  const incoming = await headers()
  const cookieHeader = incoming.get("cookie") ?? ""
  const { data } = await client.documents({ id: documentId }).get({
    headers: {
      cookie: cookieHeader,
    },
  })

  return {
    title: data ? `${data.title} — My Documents` : "Document",
  }
}
```

**Conversation page** (`app/(app)/documents/[documentId]/conversations/[conversationId]/page.tsx`):

```typescript
export async function generateMetadata({
  params,
}: ConversationPageProps): Promise<Metadata> {
  const { conversationId } = await params
  const incoming = await headers()
  const cookieHeader = incoming.get("cookie") ?? ""
  const { data } = await client.conversations({ id: conversationId }).get({
    headers: {
      cookie: cookieHeader,
    },
  })

  return {
    title: data?.title ?? "Conversation",
  }
}
```

Both pages follow the same pattern:

1. Await `params` to get the ID
2. Read cookies from `headers()` to authenticate the API call
3. Fetch the resource using the Eden Treaty client
4. Return a title based on the fetched data, with a fallback

### 4. Search Engine Files

#### robots.txt

Generated by `app/robots.ts`:

```typescript
import type { MetadataRoute } from "next";
import { APP_URL } from "@/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/documents/"],
    },
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
```

**Output** (`/robots.txt`):

```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /documents/
Sitemap: https://askdoc.ai/sitemap.xml
```

- Public pages (`/`, `/login`, `/register`, `/health`) are crawlable.
- API routes and authenticated document pages are disallowed.

#### sitemap.xml

Generated by `app/sitemap.ts`:

```typescript
import type { MetadataRoute } from "next";
import { APP_URL } from "@/constants";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: APP_URL,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${APP_URL}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${APP_URL}/register`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${APP_URL}/health`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.3,
    },
  ];
}
```

Only public, unauthenticated routes are included. Authenticated routes like `/documents` are excluded since search engines cannot crawl them.

### 5. Auth Page Refactoring Pattern

Login and register pages were originally `"use client"` components, which cannot export `metadata` (a Next.js constraint — only server components can export metadata).

**Pattern used:** Extract the client-side logic into a separate component, keep the page as a thin server component.

**Before:**

```
app/(auth)/login/page.tsx   ← "use client", full form logic inline
```

**After:**

```
components/auth/login-form.tsx    ← "use client", form logic moved here
app/(auth)/login/page.tsx         ← server component, exports metadata
```

Login page (`app/(auth)/login/page.tsx`):

```typescript
import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign In",
};

export default function LoginPage() {
  return <LoginForm />;
}
```

The same pattern applies to the register page with `components/auth/register-form.tsx`.

This approach preserves all client-side interactivity while enabling per-page metadata.

---

## How-to Guide: Adding SEO to a Page

### Adding metadata to a static page

If you are creating a new server page (no `"use client"` directive), add a `metadata` export:

```typescript
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Name",   // Automatically formatted as "Page Name | AskDoc"
};

export default function Page() {
  return <div>...</div>;
}
```

If the page is a `"use client"` component, follow the auth page refactoring pattern:

1. Extract the client component into `components/<area>/`.
2. Replace the page file with a server component that renders the extracted client component.
3. Add the `metadata` export to the page file.

### Adding metadata to a dynamic page

For pages with route parameters, use `generateMetadata`:

```typescript
import type { Metadata } from "next";
import { headers } from "next/headers";
import { client } from "@/lib/api";

type PageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params
  const incoming = await headers()
  const cookieHeader = incoming.get("cookie") ?? ""
  const { data } = await client.resource({ id }).get({
    headers: { cookie: cookieHeader },
  })

  return {
    title: data?.name ?? "Fallback Title",
  }
}
```

Key points:

- `params` is a `Promise` — must be awaited.
- Pass the cookie header for authenticated API calls.
- Always provide a fallback title in case the fetch fails or returns no data.

### Adding a public route to the sitemap

Open `app/sitemap.ts` and add a new entry to the array:

```typescript
{
  url: `${APP_URL}/new-public-page`,
  lastModified: new Date(),
  changeFrequency: "monthly",
  priority: 0.6,
}
```

Only add routes that are accessible without authentication. Authenticated routes (under `/documents`) should not appear in the sitemap.

### Checklist for new pages

- [ ] Does the page have a `metadata` export or `generateMetadata`?
- [ ] Does the title follow the `"Section Name"` pattern (without repeating `"| AskDoc"`)?
- [ ] If the page is `"use client"`, has the client logic been extracted so the page file can be a server component?
- [ ] If the page is public and unauthenticated, is it included in `app/sitemap.ts`?
- [ ] If the page is authenticated, is its path disallowed in `app/robots.ts`?
