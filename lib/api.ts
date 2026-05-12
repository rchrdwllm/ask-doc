import { treaty } from "@elysia/eden";
import type { App } from "./elysia";

const DEFAULT_PROD_URL = "https://ask-doc-lac.vercel.app";

const baseUrl = (() => {
	if (typeof window !== "undefined") {
		return window.location.origin;
	}

	return process.env.NEXT_PUBLIC_APP_URL ??
		(process.env.NODE_ENV === "development" ? "http://localhost:3000" : DEFAULT_PROD_URL);
})();

export const client = treaty<App>(baseUrl).api;
