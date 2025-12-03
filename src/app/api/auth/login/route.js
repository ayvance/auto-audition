import { verifyUser } from "@/lib/storage";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SignJWT } from "jose";

// Simple in-memory rate limiter (resets on server restart)
const loginAttempts = new Map();
const BLOCK_DURATION = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;

const SECRET_KEY = new TextEncoder().encode(
    process.env.JWT_SECRET || "default-secret-key-change-in-production"
);

export async function POST(request) {
    try {
        const ip = request.headers.get("x-forwarded-for") || "unknown";
        const now = Date.now();

        // Check rate limit
        const attempts = loginAttempts.get(ip);
        if (attempts) {
            if (attempts.blockedUntil > now) {
                const remaining = Math.ceil((attempts.blockedUntil - now) / 1000);
                return NextResponse.json(
                    { success: false, message: `ログイン試行回数が多すぎます。${remaining}秒後に再試行してください。` },
                    { status: 429 }
                );
            }
            // Reset if block expired
            if (attempts.blockedUntil && attempts.blockedUntil <= now) {
                loginAttempts.delete(ip);
            }
        }

        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { success: false, message: "メールアドレスとパスワードを入力してください" },
                { status: 400 }
            );
        }

        const user = await verifyUser(email, password);

        if (!user) {
            // Increment failed attempts
            const current = loginAttempts.get(ip) || { count: 0, blockedUntil: 0 };
            current.count++;
            
            if (current.count >= MAX_ATTEMPTS) {
                current.blockedUntil = now + BLOCK_DURATION;
            }
            
            loginAttempts.set(ip, current);

            return NextResponse.json(
                { success: false, message: "メールアドレスまたはパスワードが間違っています" },
                { status: 401 }
            );
        }

        // Reset attempts on success
        loginAttempts.delete(ip);

        // Generate JWT
        const token = await new SignJWT({ sub: user.id, email: user.email })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime("24h")
            .sign(SECRET_KEY);

        // Set HTTP-only cookie
        const cookieStore = await cookies();
        cookieStore.set("admin_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 60 * 60 * 24, // 1 day
            path: "/",
        });

        return NextResponse.json({ success: true, user });
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json(
            { success: false, message: "ログイン処理中にエラーが発生しました" },
            { status: 500 }
        );
    }
}
