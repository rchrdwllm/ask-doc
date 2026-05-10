import { Elysia } from "elysia";
import { auth } from "@/lib/auth";
import { healthRouter } from "@/routes/health";
import { documentsRouter } from "@/routes/documents";

const app = new Elysia({ prefix: "/api" })
  .mount(auth.handler)
  .use(healthRouter)
  .use(documentsRouter);

export const handler = app.handle;

export type App = typeof app;
