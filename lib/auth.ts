// This is auth instance, which is different from the React auth client
// This is for server-side

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import { user, session, account, verification } from "@/db/schema";
import { nextCookies } from "better-auth/next-js";

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
  // We do this kasi if we call call functions that need to set cookies in a server action, di mas-set yung cookies
  // But pag from client components, it would work kahit wala na eto
  plugins: [nextCookies()],
});
