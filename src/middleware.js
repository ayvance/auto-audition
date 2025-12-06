import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Security check for JWT_SECRET
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret && process.env.NODE_ENV === "production") {
    console.warn("WARNING: JWT_SECRET is not set in production. Using default insecure key.");
}

const SECRET_KEY = new TextEncoder().encode(
    jwtSecret || "default-secret-key-change-in-production"
);

export async function middleware(request) {
    const path = request.nextUrl.pathname;

    // Protect /admin routes
    if (path.startsWith("/admin")) {
        // Allow access to login page
        if (path === "/admin/login") {
            return NextResponse.next();
        }

        // Check for auth cookie
        const token = request.cookies.get("admin_token")?.value;

        if (!token) {
            return NextResponse.redirect(new URL("/admin/login", request.url));
        }

        try {
            // Verify JWT
            await jwtVerify(token, SECRET_KEY);
            return NextResponse.next();
        } catch (error) {
            // Invalid token
            return NextResponse.redirect(new URL("/admin/login", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: "/admin/:path*",
};
