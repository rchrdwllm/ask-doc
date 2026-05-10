import { treaty } from "@elysia/eden";
import type { App } from "./elysia";

export const client = treaty<App>("http://localhost:3000").api;
