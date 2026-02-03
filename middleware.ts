import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt } from "@/lib/auth";

export async function middleware(request: NextRequest) {
    const sessionCookie = request.cookies.get("session")?.value;
    const session = sessionCookie ? await decrypt(sessionCookie) : null;

    const isLoginPage = request.nextUrl.pathname === "/login";
    const isPublicAsset = request.nextUrl.pathname.startsWith("/_next") ||
        request.nextUrl.pathname.startsWith("/static") ||
        request.nextUrl.pathname.includes("."); // files like favicon.ico, manifest.json

    if (isPublicAsset) {
        return NextResponse.next();
    }

    // If not logged in and trying to access protected route
    if (!session && !isLoginPage) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // If logged in and trying to access login page
    if (session && isLoginPage) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
