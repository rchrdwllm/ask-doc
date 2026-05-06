import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

const publicPages = ["/login", "/register"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow unauthenticated access to public pages
  if (publicPages.includes(pathname)) {
    return NextResponse.next();
  }

  // Allow unauthenticated access to authentication routes
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Exclude authentication routes, Next.js internals, and static assets from the proxy
  matcher: ["/((?!api/auth|login|register|_next|static|favicon.ico).*)"],
};
