# Authentication Testing Tutorial (Unit + E2E)

This tutorial walks you through setting up a complete testing stack for authentication in this project. You will add unit tests with mocks and full end-to-end tests, then run them locally and in CI.

## What you will build

- A unit-test setup with mocking for auth configuration, client calls, and schemas.
- A repeatable E2E test flow for sign-up, sign-in, sign-out, and protected routes.
- A clean test data strategy with a dedicated test database.

## Tooling choices (and why)

- Vitest: fast unit tests, first-class mocking, great TypeScript support.
- Testing Library: UI-focused unit tests that match how users interact.
- MSW: API mocking that mirrors real network behavior.
- Playwright: reliable E2E tests for real browsers.

These tools work well with Next.js and Bun.

## Step 1: Install dev dependencies

Run these commands from the project root:

```bash
bun add -d vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event msw vite-tsconfig-paths
bun add -d @playwright/test
bunx playwright install
```

## Step 2: Configure the unit test runner

Create a Vitest config file in the project root with the following contents:

```ts
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    globals: true,
    clearMocks: true,
  },
});
```

Create a test setup file at the path referenced above:

```ts
import "@testing-library/jest-dom";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "./test-server";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

Create the MSW server and handlers used in tests:

```ts
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

export const handlers = [
  http.post("/api/auth/signin/email", async () => {
    return HttpResponse.json({ ok: true }, { status: 200 });
  }),
  http.post("/api/auth/signup/email", async () => {
    return HttpResponse.json({ ok: true }, { status: 200 });
  }),
  http.post("/api/auth/signout", async () => {
    return HttpResponse.json({ ok: true }, { status: 200 });
  }),
  http.get("/api/auth/session", async () => {
    return HttpResponse.json({
      user: { id: "user_1", email: "test@example.com" },
    });
  }),
];

export const server = setupServer(...handlers);
```

## Step 3: Add test scripts

Update the scripts section in [package.json](package.json) to include testing commands:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:unit": "vitest run",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

## Step 4: Unit tests with mocking

### 4.1 Test the validation schemas

Example unit tests for the login and registration schemas:

```ts
import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "@/lib/schemas/auth";

describe("auth schemas", () => {
  it("accepts a valid login payload", () => {
    const result = loginSchema.safeParse({
      email: "valid@example.com",
      password: "password123",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a short password on register", () => {
    const result = registerSchema.safeParse({
      name: "Test",
      email: "valid@example.com",
      password: "short",
      confirmPassword: "short",
    });

    expect(result.success).toBe(false);
  });
});
```

### 4.2 Test the auth client module with mocks

Mock the auth client so tests do not call the real Better Auth client:

```ts
import { describe, expect, it, vi } from "vitest";

vi.mock("better-auth/react", () => {
  return {
    createAuthClient: () => ({
      signIn: {
        email: vi.fn().mockResolvedValue({ error: null }),
        social: vi.fn().mockResolvedValue({ error: null }),
      },
      signUp: {
        email: vi.fn().mockResolvedValue({ error: null }),
      },
      signOut: vi.fn().mockResolvedValue({ error: null }),
      getSession: vi.fn().mockResolvedValue({ data: null }),
      getUser: vi.fn().mockResolvedValue({ data: null }),
    }),
  };
});

import { authClient } from "@/lib/auth-client";

describe("auth client", () => {
  it("calls email sign-in with provided data", async () => {
    const result = await authClient.signIn.email({
      email: "test@example.com",
      password: "password123",
      callbackURL: "/documents",
    });

    expect(result.error).toBeNull();
  });
});
```

### 4.3 Test the server auth configuration

Mock the Better Auth initializer to validate config shape and env usage:

```ts
import { describe, expect, it, vi } from "vitest";

const betterAuthMock = vi.fn((config) => ({ config }));

vi.mock("better-auth", () => ({
  betterAuth: (config: unknown) => betterAuthMock(config),
}));

vi.mock("better-auth/plugins", () => ({
  nextCookies: () => "nextCookiesPlugin",
}));

vi.mock("@/db", () => ({
  db: {},
}));

vi.mock("better-auth/adapters/drizzle", () => ({
  drizzleAdapter: vi.fn(() => "drizzleAdapter"),
}));

import { auth } from "@/lib/auth";

describe("server auth config", () => {
  it("includes google provider when env vars are set", () => {
    process.env.GOOGLE_CLIENT_ID = "client";
    process.env.GOOGLE_CLIENT_SECRET = "secret";

    expect(auth).toBeDefined();
    expect(betterAuthMock).toHaveBeenCalled();

    const config = betterAuthMock.mock.calls[0][0] as Record<string, unknown>;
    expect(config).toHaveProperty("socialProviders");
  });
});
```

### 4.4 Test the auth API route wiring

Mock the Next.js handler wrapper to confirm route export behavior:

```ts
import { describe, expect, it, vi } from "vitest";

vi.mock("better-auth/next-js", () => ({
  toNextJsHandler: () => ({ GET: "GET_HANDLER", POST: "POST_HANDLER" }),
}));

import * as route from "@/app/api/auth/[...all]/route";

describe("auth route", () => {
  it("exports GET and POST handlers", () => {
    expect(route.GET).toBe("GET_HANDLER");
    expect(route.POST).toBe("POST_HANDLER");
  });
});
```

## Step 5: Configure Playwright for E2E tests

Create a Playwright config file in the project root with this content:

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  retries: 1,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "bun run dev",
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
```

## Step 6: Set up a test database

Create a dedicated test database and keep it separate from development. Use a test-only environment file and point the database URL to the test database. Then run the schema push using the test env.

Example commands:

```bash
# Replace with your test DB connection string
DATABASE_URL="postgres://user:pass@host:5432/ask_doc_test" bun run db:push
```

## Step 7: E2E auth tests

### 7.1 Sign-up flow

```ts
import { test, expect } from "@playwright/test";

test("user can sign up with email", async ({ page }) => {
  await page.goto("/register");

  await page.getByLabel("Name").fill("Test User");
  await page.getByLabel("Email").fill("test+signup@example.com");
  await page.getByLabel("Password").fill("password123");
  await page.getByLabel("Confirm Password").fill("password123");
  await page.getByRole("button", { name: /create account/i }).click();

  await expect(page).toHaveURL(/documents/);
});
```

### 7.2 Sign-in flow

```ts
import { test, expect } from "@playwright/test";

test("user can sign in with email", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("Email").fill("test+login@example.com");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: /sign in/i }).click();

  await expect(page).toHaveURL(/documents/);
});
```

### 7.3 Sign-out flow

```ts
import { test, expect } from "@playwright/test";

test("user can sign out", async ({ page }) => {
  await page.goto("/documents");
  await page.getByRole("button", { name: /sign out/i }).click();

  await expect(page).toHaveURL(/login/);
});
```

### 7.4 Protected route enforcement

```ts
import { test, expect } from "@playwright/test";

test("unauthenticated users are redirected", async ({ page }) => {
  await page.goto("/documents");
  await expect(page).toHaveURL(/login/);
});
```

### 7.5 Google OAuth button smoke test

For E2E, avoid calling the real provider. A simple test can assert that the OAuth button routes to the correct endpoint:

```ts
import { test, expect } from "@playwright/test";

test("google sign-in starts OAuth flow", async ({ page }) => {
  await page.goto("/login");
  const [request] = await Promise.all([
    page.waitForRequest((req) => req.url().includes("/api/auth/signin/google")),
    page.getByRole("button", { name: /google/i }).click(),
  ]);

  expect(request.url()).toContain("/api/auth/signin/google");
});
```

## Step 8: Run tests

- Unit tests: `bun run test:unit`
- E2E tests: `bun run test:e2e`
- UI runners: `bun run test:ui` and `bun run test:e2e:ui`

## Troubleshooting

- If unit tests fail with missing DOM APIs, ensure the test environment is set to jsdom.
- If E2E tests fail on CI, confirm the base URL and port match the web server config.
- If auth tests flake, ensure the test database is isolated and clean between runs.

## Next steps

- Add coverage reporting for unit tests.
- Add fixture helpers for common auth actions (create user, log in, log out).
- Expand to API-level tests once document endpoints are implemented.
