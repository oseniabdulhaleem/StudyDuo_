// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Public paths that don't require authentication
  const publicPaths = [
    "/auth/login",
    "/auth/signup",
    "/auth/reset-password",
    "/auth/check-email",
  ];

  const isPublicPath = publicPaths.includes(request.nextUrl.pathname);
  const token = request.cookies.get("authToken");

  // Redirect authenticated users away from auth pages
  if (isPublicPath && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect unauthenticated users to login
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/auth/login",
    "/auth/signup",
    "/auth/reset-password",
    "/auth/check-email",
  ],
};
