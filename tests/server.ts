import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/api", async () => {
    return HttpResponse.json({ ok: true }, { status: 200 });
  }),
  http.post("/api/auth/signin/email", async () => {
    return HttpResponse.json({ ok: true }, { status: 200 });
  }),
  http.post("/api/auth/signup/email", async () => {
    return HttpResponse.json({ ok: true }, { status: 200 });
  }),
  http.post("/api/auth/signout", async () => {
    return HttpResponse.json({ ok: true }, { status: 200 });
  }),
  http.get("/api/auth/session", async () => {
    return HttpResponse.json({
      user: { id: "user_1", email: "test@example.com" },
    });
  }),
];

export const server = setupServer(...handlers);
