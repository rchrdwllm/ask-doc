import { Elysia } from "elysia";
import { auth } from "@/lib/auth";

const app = new Elysia({ prefix: "/api" })
  .mount(auth.handler)
  .get("/", () => ({ ok: true }));

export const GET = app.fetch;
export const POST = app.fetch;
