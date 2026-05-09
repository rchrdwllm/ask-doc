import { Elysia } from "elysia";
import { auth } from "@/lib/auth";
import { healthRouter } from "@/routes/health";

const app = new Elysia({ prefix: "/api" })
  .mount(auth.handler)
  .use(healthRouter);

export const handler = app.handle;

export type App = typeof app;
