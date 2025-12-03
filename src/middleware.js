import { NextResponse } from "next/server";

export function middleware(request) {
    const path = request.nextUrl.pathname;

    // Protect /admin routes
    if (path.startsWith("/admin")) {
        // Allow access to login page
        if (path === "/admin/login") {
            return NextResponse.next();
        }

        // Check for auth cookie
        const token = request.cookies.get("admin_token");

        if (!token) {
            return NextResponse.redirect(new URL("/admin/login", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: "/admin/:path*",
};
