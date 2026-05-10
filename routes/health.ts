import { Elysia } from "elysia";
import * as z from "zod";

export const healthRouter = new Elysia({ prefix: "/health" }).get(
  "/",
  () => {
    return {
      status: "ok",
    };
  },
  {
    response: z.object({
      status: z.string(),
    }),
  },
);
