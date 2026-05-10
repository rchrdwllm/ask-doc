import { Elysia } from "elysia";
import * as z from "zod";

export const healthRouter = new Elysia({ prefix: "/health" }).get(
  "/",
  ({ status }) => {
    return status(200, {
      status: "OK",
    });
  },
  {
    response: {
      200: z.object({
        status: z.string(),
      }),
      500: z.object({
        error: z.object({
          code: z.string(),
          message: z.string(),
        }),
      }),
    },
  },
);
