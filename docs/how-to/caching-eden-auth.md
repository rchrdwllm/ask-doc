# How-to: Cache Eden + Auth pages per user

This guide shows how to add server caching for pages that call Eden with auth cookies, while keeping caches scoped to the current user. It uses cached server helpers in `lib/server/*` and tag-based invalidation after mutations.

## Goal

- Cache Eden calls even when a page reads `headers()` and uses auth cookies.
- Scope cached responses by `session.user.id`.
- Invalidate cached data after mutations.

## Before you start

You should have:

- A Server Component page that calls Eden.
- Access to the Better Auth session (`auth.api.getSession`).
- A place to add server helpers under `lib/server/`.

## Step 1: Add a cached server helper

Create or update a helper in `lib/server/*` that wraps the Eden call and applies cache tags. Always include the user ID in the tag so the cache is per user.

Example: documents list helper (`lib/server/documents.ts`)

```ts
import { cacheLife, cacheTag } from "next/cache";
import { client } from "@/lib/api";

export const getDocuments = async (cookie: string, userId: string) => {
  "use cache";

  cacheLife("hours");
  cacheTag(`${userId}:documents`);

  const { data, error } = await client.documents.get({
    fetch: {
      headers: {
        cookie,
      },
    },
  });

  return { data, error };
};
```

Example: document detail helper (`lib/server/documents.ts`)

```ts
export const getDocumentById = async (
  documentId: string,
  cookie: string,
  userId: string,
) => {
  "use cache";

  cacheLife("hours");
  cacheTag(`${userId}:documents:${documentId}`);

  const { data, error } = await client.documents({ id: documentId }).get({
    fetch: {
      headers: {
        cookie,
      },
    },
  });

  return { data, error };
};
```

You can apply the same pattern for conversations and last-message lookups:

- `lib/server/conversations.ts` uses `cacheTag(`${userId}:documents:${documentId}:conversations`)`
- `lib/server/messages.ts` uses `cacheTag(`${userId}:conversations:${conversationId}:lastMessage`)`

## Step 2: Use the helper in a page

Replace direct Eden calls in the page with the cached helper. Always read the session and pass the user ID into the helper.

Example: documents list page (`app/(app)/documents/page.tsx`)

```ts
const incoming = await headers();
const cookieHeader = incoming.get("cookie") ?? "";
const session = await auth.api.getSession({ headers: incoming });

const { data, error } = await getDocuments(cookieHeader, session!.user.id);
```

Example: document detail page (`app/(app)/documents/[documentId]/page.tsx`)

```ts
const incoming = await headers();
const cookieHeader = incoming.get("cookie") ?? "";
const session = await auth.api.getSession({ headers: incoming });

const { data, error } = await getDocumentById(
  documentId,
  cookieHeader,
  session!.user.id,
);
```

## Step 3: Invalidate cache after mutations

After a mutation (create, update, delete), call `updateTag` with the same tags used in your cached helpers. Use the current user ID, not the cookie.

Example: document delete action (`lib/server/actions/documents.ts`)

```ts
const incoming = await headers();
const session = await auth.api.getSession({ headers: incoming });
const userId = session!.user.id;

updateTag(`${userId}:documents`);
updateTag(`${userId}:documents:${documentId}`);
```

If your page reads cached conversations or last messages, invalidate those tags too:

```ts
updateTag(`${userId}:documents:${documentId}:conversations`);
updateTag(`${userId}:conversations:${conversationId}:lastMessage`);
```

## Step 4: Verify the cache

1. Load the page once, then refresh it.
2. Trigger a mutation that calls `updateTag`.
3. Reload the page and confirm the updated data appears.

Note: Next.js cache behavior is best validated with a production build (`bun run build` + `bun run start`).

## Troubleshooting

- **Stale data after a mutation**: the `updateTag` value does not match the `cacheTag` used in the helper.
- **Data leaks between users**: the tag does not include `session.user.id`.
- **No caching at all**: the helper is missing the `"use cache"` directive.

## Related files

- `lib/server/documents.ts`
- `lib/server/conversations.ts`
- `lib/server/messages.ts`
- `lib/server/actions/documents.ts`
- `app/(app)/documents/page.tsx`
- `app/(app)/documents/[documentId]/page.tsx`
