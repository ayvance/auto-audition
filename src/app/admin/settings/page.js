"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Lock } from "lucide-react";

export default function SettingsPage() {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        fetch("/api/notifications")
            .then(res => res.json())
            .then(data => setNotifications(data));
    }, []);

    async function handleChangePassword(e) {
        e.preventDefault();
        setMessage({ type: "", text: "" });

        if (newPassword !== confirmPassword) {
            setMessage({ type: "error", text: "新しいパスワードが一致しません" });
            return;
        }

        if (newPassword.length < 4) {
            setMessage({ type: "error", text: "パスワードは4文字以上で設定してください" });
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/auth/change-password", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: "info@virtuacross.com", // Hardcoded for this demo as we don't have full session user context in client
                    currentPassword,
                    newPassword,
                }),
            });

            const data = await res.json();

            if (data.success) {
                setMessage({ type: "success", text: "パスワードを変更しました" });
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
            } else {
                setMessage({ type: "error", text: data.message });
            }
        } catch (error) {
            setMessage({ type: "error", text: "エラーが発生しました" });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="container py-8">
            <header className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold">設定</h1>
                <Link href="/admin" className="btn btn-ghost">
                    <ArrowLeft size={18} /> ダッシュボードに戻る
                </Link>
            </header>

            <div className="max-w-md mx-auto">
                <div className="card space-y-6 animate-fade-in">
                    <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                        <div className="p-2 bg-primary/10 rounded-full text-primary">
                            <Lock size={20} />
                        </div>
                        <h2 className="text-xl font-semibold">パスワード変更</h2>
                    </div>

                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div className="space-y-2">
                            <label className="label">現在のパスワード</label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="input"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="label">新しいパスワード</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="input"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="label">新しいパスワード（確認）</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="input"
                                required
                            />
                        </div>

                        {message.text && (
                            <div
                                className={`p-3 rounded text-sm text-center ${message.type === "success"
                                    ? "bg-green-500/10 text-green-500"
                                    : "bg-destructive/10 text-destructive"
                                    }`}
                            >
                                {message.text}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary w-full"
                        >
                            <Save size={18} /> {loading ? "変更中..." : "パスワードを変更"}
                        </button>
                    </form>
                </div>

                <div className="card space-y-6 animate-fade-in mt-8">
                    <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                        <h2 className="text-xl font-semibold">通知ログ (シミュレーション)</h2>
                    </div>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <p className="text-muted-foreground text-center py-4">通知履歴はありません</p>
                        ) : (
                            notifications.map(log => (
                                <div key={log.id} className="p-4 rounded bg-secondary/30 text-sm space-y-1">
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>To: {log.to}</span>
                                        <span>{new Date(log.sentAt).toLocaleString()}</span>
                                    </div>
                                    <div className="font-medium">{log.subject}</div>
                                    <div className="text-muted-foreground">{log.body}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
