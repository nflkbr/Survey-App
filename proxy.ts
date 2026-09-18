import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";

const ADMIN_PATHS = [
  "/dashboard",
  "/responden",
  "/kuesioner",
  "/hasil",
  "/reward",
];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if it's an admin path (not login)
  const isAdminPath = ADMIN_PATHS.some((p) => pathname.startsWith(p));

  if (!isAdminPath) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const payload = await verifyToken(token);
  if (!payload) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete(COOKIE_NAME);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/responden/:path*",
    "/kuesioner/:path*",
    "/hasil/:path*",
    "/reward/:path*",
  ],
};
