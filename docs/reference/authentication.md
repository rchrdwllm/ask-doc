# Authentication Reference

This document provides complete technical reference for the authentication system in AskDoc.

## Architecture Overview

The authentication system uses [Better Auth](https://www.better-auth.com/) with the following components:

- **Server-side**: `lib/auth.ts` - Better Auth instance with database adapter
- **Client-side**: `lib/auth-client.ts` - Auth client for React components
- **API**: `app/api/auth/[...all]/route.ts` - Auth endpoint handler
- **Database**: Drizzle ORM with PostgreSQL schema
- **Validation**: Zod schemas for form validation

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Client    │────▶│  API       │────▶│  Database  │
│  (React)   │     │  (Next.js) │     │  (Postgres)│
└─────────────┘     └─────────────┘     └─────────────┘
       │                                       │
       ▼                                       ▼
┌─────────────┐                         ┌─────────────┐
│ authClient │                         │ Drizzle   │
│           │                         │ Adapter  │
└─────────────┘                         └─────────────┘
```

## Database Schema

All tables are defined in `db/schema.ts`.

### User Table

Stores user profile information.

```typescript
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
```

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | text | primaryKey | Unique user identifier |
| `name` | text | notNull | User's display name |
| `email` | text | notNull, unique | User's email address |
| `emailVerified` | boolean | default(false) | Whether email is verified |
| `image` | text | nullable | URL to user's avatar |
| `createdAt` | timestamp | notNull, defaultNow | Creation timestamp |
| `updatedAt` | timestamp | notNull, autoUpdate | Last update timestamp |

### Session Table

Manages active user sessions.

```typescript
export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);
```

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | text | primaryKey | Unique session identifier |
| `expiresAt` | timestamp | notNull | Session expiration time |
| `token` | text | notNull, unique | Session token for authentication |
| `createdAt` | timestamp | notNull, defaultNow | Creation timestamp |
| `updatedAt` | timestamp | notNull, autoUpdate | Last update timestamp |
| `ipAddress` | text | nullable | Client IP address |
| `userAgent` | text | nullable | Client user agent |
| `userId` | text | notNull, foreignKey | Reference to user |

**Indexes:**
- `session_userId_idx` on `userId` - For session lookups by user

### Account Table

Links external OAuth accounts or credentials to users.

```typescript
export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);
```

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | text | primaryKey | Unique account identifier |
| `accountId` | text | notNull | Provider-specific account ID |
| `providerId` | text | notNull | OAuth provider identifier |
| `userId` | text | notNull, foreignKey | Reference to user |
| `accessToken` | text | nullable | OAuth access token |
| `refreshToken` | text | nullable | OAuth refresh token |
| `idToken` | text | nullable | OAuth ID token |
| `accessTokenExpiresAt` | timestamp | nullable | Access token expiration |
| `refreshTokenExpiresAt` | timestamp | nullable | Refresh token expiration |
| `scope` | text | nullable | OAuth scope |
| `password` | text | nullable | Hashed password (for credentials) |
| `createdAt` | timestamp | notNull, defaultNow | Creation timestamp |
| `updatedAt` | timestamp | notNull, autoUpdate | Last update timestamp |

**Indexes:**
- `account_userId_idx` on `userId` - For account lookups by user

### Verification Table

Stores email verification and magic link tokens.

```typescript
export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);
```

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | text | primaryKey | Unique verification identifier |
| `identifier` | text | notNull | What is being verified (e.g., email) |
| `value` | text | notNull | Verification token value |
| `expiresAt` | timestamp | notNull | Token expiration time |
| `createdAt` | timestamp | notNull, defaultNow | Creation timestamp |
| `updatedAt` | timestamp | notNull, autoUpdate | Last update timestamp |

**Indexes:**
- `verification_identifier_idx` on `identifier` - For verification lookups

### Table Relationships

```typescript
export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));
```

- **User** has many **Sessions** (one-to-many)
- **User** has many **Accounts** (one-to-many)
- **Session** belongs to one **User** (many-to-one)
- **Account** belongs to one **User** (many-to-one)

## Authentication Configuration

Defined in `lib/auth.ts`.

### Better Auth Instance

```typescript
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user,
      session,
      account,
      verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  account: {
    accountLinking: {
      updateUserInfoOnLink: true,
      enabled: true,
    },
  },
  plugins: [nextCookies()],
});
```

### Configuration Options

| Option | Type | Description |
|--------|------|-------------|
| `database` | drizzleAdapter | Drizzle ORM adapter for PostgreSQL |
| `emailAndPassword.enabled` | boolean | Enable email/password authentication |
| `socialProviders.google` | object | Google OAuth configuration |
| `account.accountLinking.enabled` | boolean | Allow linking multiple accounts to one user |
| `account.accountLinking.updateUserInfoOnLink` | boolean | Update user info when linking accounts |
| `plugins` | array | Additional plugins (nextCookies) |

### Email and Password

- **Enabled**: `true` - Users can register and sign in with email/password
- **Passwords stored**: Hashed in the `account.password` field

### Social Providers

#### Google OAuth

- **clientId**: From `GOOGLE_CLIENT_ID` environment variable
- **clientSecret**: From `GOOGLE_CLIENT_SECRET` environment variable

### Account Linking

When enabled, users can link multiple authentication methods to the same account (e.g., Google OAuth + email/password).

### Plugins

#### nextCookies()

Required for proper cookie handling in Next.js server actions and route handlers.

## API Routes

Defined in `app/api/auth/[...all]/route.ts`.

```typescript
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

### Endpoints

All auth endpoints are handled by Better Auth at `/api/auth`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup/email` | Register with email/password |
| POST | `/api/auth/signin/email` | Sign in with email/password |
| GET/POST | `/api/auth/signin/google` | OAuth Google sign-in |
| GET/POST | `/api/auth/signout` | Sign out |
| GET | `/api/auth/session` | Get current session |
| POST | `/api/auth/verify` | Verify email |

## Client-Side Usage

Defined in `lib/auth-client.ts`.

### Auth Client Instance

```typescript
export const authClient = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL!,
});
```

### Available Methods

#### Sign In with Email/Password

```typescript
const { error } = await authClient.signIn.email({
  email,
  password,
  callbackURL: "/dashboard",
});
```

#### Sign In with Social Provider

```typescript
const { error } = await authClient.signIn.social({
  provider: "google",
});
```

#### Sign Up with Email/Password

```typescript
const { error } = await authClient.signUp.email({
  email,
  password,
  name,
  image, // optional
}, {
  onSuccess: () => {
    router.push("/dashboard");
  },
});
```

#### Sign Out

```typescript
await authClient.signOut();
```

#### Get Current Session

```typescript
const { data: session } = await authClient.getSession();
```

#### Get Current User

```typescript
const { data: user } = await authClient.getUser();
```

### Error Handling

All methods return an object with `error` property:

```typescript
const { error } = await authClient.signIn.email({...});

if (error) {
  console.error(error.message);
}
```

## Validation Schemas

Defined in `lib/schemas/auth.ts`.

### Login Schema

```typescript
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
```

| Field | Validation | Error Message |
|-------|------------|---------------|
| `email` | valid email | "Invalid email address" |
| `password` | min 1 character | "Password is required" |

### Register Schema

```typescript
export const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
```

| Field | Validation | Error Message |
|-------|------------|---------------|
| `name` | min 1 character | "Name is required" |
| `email` | valid email | "Invalid email address" |
| `password` | min 8 characters | "Password must be at least 8 characters" |
| `confirmPassword` | min 1 character | "Please confirm your password" |
| cross-field | password === confirmPassword | "Passwords don't match" |

### Type Exports

```typescript
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
```

## Environment Variables

Required environment variables for authentication:

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_CLIENT_ID` | Yes* | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes* | Google OAuth client secret |
| `BETTER_AUTH_URL` | Yes | Base URL for Better Auth (e.g., http://localhost:3000) |

*Required if Google OAuth is enabled

Add these to your `.env.local` file:

```bash
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
BETTER_AUTH_URL=http://localhost:3000
```

## Related Files

### File Structure

```
app/
├── api/
│   └── auth/
│       └── [...all]/
│           └── route.ts          # Auth API handler
│
lib/
│   ├── auth.ts                 # Server-side auth instance
│   ├── auth-client.ts           # Client-side auth client
│   ├── schemas/
│   │   └── auth.ts            # Zod validation schemas
│   └── utils.ts               # Utility functions
│
db/
│   ├── index.ts               # Database connection
│   └── schema.ts              # Database schema
```

### Dependencies

- **better-auth** - Authentication framework
- **better-auth/react** - React hooks and client
- **better-auth/next-js** - Next.js integration
- **drizzle-orm** - ORM for database operations
- **@hookform/resolvers** - Zod integration for React Hook Form
- **zod** - Schema validation

### Package.json Dependencies

```json
{
  "better-auth": "^latest",
  "drizzle-orm": "^latest",
  "zod": "^latest",
  "@hookform/resolvers": "^latest",
  "react-hook-form": "^latest"
}
```

## Page Implementation

### Login Page (`/login`)

Located at `app/(auth)/login/page.tsx`.

Features:
- Email/password sign-in form with validation
- Google OAuth sign-in button
- Error handling with AlertDialog
- Loading states during submission
- Link to registration page

### Register Page (`/register`)

Located at `app/(auth)/register/page.tsx`.

Features:
- Name, email, password, confirm password fields
- Client-side validation with Zod schemas
- Email/password registration
- Google OAuth sign-up button
- Error handling with AlertDialog
- Loading states during submission
- Link to login page

### Dashboard Page (`/dashboard`)

Located at `app/(app)/dashboard/page.tsx`.

Protected route accessible only to authenticated users.

## Security Considerations

1. **Password requirements**: Minimum 8 characters
2. **Password confirmation**: Required to prevent typos
3. **Account linking**: Users can link multiple auth methods
4. **Session management**: Tokens tracked with IP and user agent
5. **Cascade delete**: User deletion removes all sessions and accounts
6. **Email verification**: Configurable via Better Auth plugins

## Extending Authentication

### Adding New OAuth Providers

Add to `socialProviders` in `lib/auth.ts`:

```typescript
socialProviders: {
  github: {
    clientId: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  },
}
```

### Adding Email Verification

Add the `emailVerification` plugin:

```typescript
import { emailVerification } from "better-auth/plugins/email-verification";

export const auth = betterAuth({
  // ...other config
  plugins: [
    nextCookies(),
    emailVerification({
      sendVerificationEmail: async ({ email, link }) => {
        // Implement email sending
      },
    }),
  ],
});
```

### Adding Two-Factor Authentication

Add the `twoFactor` plugin:

```typescript
import { twoFactor } from "better-auth/plugins/2fa";

export const auth = betterAuth({
  // ...other config
  plugins: [
    nextCookies(),
    twoFactor(),
  ],
});
```