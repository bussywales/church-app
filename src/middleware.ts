import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const protectedPathPrefixes = ["/account", "/give", "/my/registrations", "/admin"];

function isProtectedPath(pathname: string) {
  if (protectedPathPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return true;
  }

  return /^\/events\/[^/]+\/register$/.test(pathname);
}

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);

  if (!isProtectedPath(request.nextUrl.pathname)) {
    return response;
  }

  if (user) {
    return response;
  }

  const loginUrl = new URL("/login", request.url);
  const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  loginUrl.searchParams.set("next", nextPath);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/account/:path*",
    "/give/:path*",
    "/my/registrations/:path*",
    "/admin/:path*",
    "/events/:id/register",
  ],
};
