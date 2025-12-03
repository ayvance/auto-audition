import { verifyUser } from "@/lib/storage";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { success: false, message: "メールアドレスとパスワードを入力してください" },
                { status: 400 }
            );
        }

        const user = await verifyUser(email, password);

        if (!user) {
            return NextResponse.json(
                { success: false, message: "メールアドレスまたはパスワードが間違っています" },
                { status: 401 }
            );
        }

        // Set HTTP-only cookie
        const cookieStore = await cookies();
        cookieStore.set("admin_token", "authenticated", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
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
