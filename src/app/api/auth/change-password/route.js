import { verifyUser, updateUserPassword } from "@/lib/storage";
import { NextResponse } from "next/server";

export async function PUT(request) {
    try {
        const { email, currentPassword, newPassword } = await request.json();

        if (!email || !currentPassword || !newPassword) {
            return NextResponse.json(
                { success: false, message: "すべての項目を入力してください" },
                { status: 400 }
            );
        }

        // Verify current password
        const user = await verifyUser(email, currentPassword);
        if (!user) {
            return NextResponse.json(
                { success: false, message: "現在のパスワードが正しくありません" },
                { status: 401 }
            );
        }

        // Update password
        const success = await updateUserPassword(email, newPassword);
        if (!success) {
            return NextResponse.json(
                { success: false, message: "パスワードの更新に失敗しました" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Change password error:", error);
        return NextResponse.json(
            { success: false, message: "エラーが発生しました" },
            { status: 500 }
        );
    }
}
