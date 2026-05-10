import { Elysia } from "elysia";
import { auth } from "@/lib/auth";
import { healthRouter } from "@/routes/health";
import { documentsRouter } from "@/routes/documents";

const app = new Elysia({ prefix: "/api" })
  .onError(({ code, error, set }) => {
    console.error("[Elysia]", code, error);

    if (code === "NOT_FOUND")
      return ((set.status = 404), { code: "NOT_FOUND", message: "Not found" });
    if (code === "VALIDATION")
      return (
        (set.status = 400),
        { code: "VALIDATION", message: error.message }
      );

    return (
      (set.status = 500),
      { code: "INTERNAL_SERVER_ERROR", message: "Internal server error" }
    );
  })
  .mount(auth.handler)
  .use(healthRouter)
  .use(documentsRouter);

export const handler = app.handle;

export type App = typeof app;
