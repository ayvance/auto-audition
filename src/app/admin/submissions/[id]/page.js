"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Star, Save, Trash2, AlertCircle } from "lucide-react";
import { useRouter, useParams } from "next/navigation";

export default function SubmissionDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [submission, setSubmission] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [formSchema, setFormSchema] = useState([]);
    const [loading, setLoading] = useState(true);
    const [evaluation, setEvaluation] = useState({ rating: 0, notes: "", status: "unreviewed" });
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        async function fetchData() {
            try {
                const [subRes, qRes, fRes] = await Promise.all([
                    fetch(`/api/submissions/${params.id}`),
                    fetch("/api/questions"),
                    fetch("/api/form-schema"),
                ]);
                const subData = await subRes.json();
                const qData = await qRes.json();
                const fData = await fRes.json();

                setSubmission(subData);
                setQuestions(qData);
                setFormSchema(fData);

                if (subData.evaluation) {
                    setEvaluation({
                        rating: subData.evaluation.rating || 0,
                        notes: subData.evaluation.notes || "",
                        status: subData.evaluation.status || "unreviewed"
                    });
                } else if (subData.status) {
                    setEvaluation(prev => ({ ...prev, status: subData.status }));
                }
            } catch (error) {
                console.error("Failed to fetch data", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [params.id]);

    async function saveEvaluation() {
        setSaving(true);
        try {
            await fetch(`/api/submissions/${params.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ evaluation }),
            });
            setSubmission({ ...submission, evaluation });

            alert("評価を保存しました！");
        } catch (error) {
            console.error(error);
            alert("評価の保存に失敗しました");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        if (!confirm("本当にこの応募データを削除しますか？この操作は取り消せません。")) return;

        setDeleting(true);
        try {
            const res = await fetch(`/api/submissions/${params.id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                alert("削除しました");
                router.push("/admin");
            } else {
                alert("削除に失敗しました");
            }
        } catch (error) {
            alert("エラーが発生しました");
        } finally {
            setDeleting(false);
        }
    }

    if (loading) return <div className="text-center py-12">読み込み中...</div>;
    if (!submission) return <div className="text-center py-12">応募データが見つかりません</div>;

    return (
        <div className="container py-8">
            <Link href="/admin" className="btn btn-ghost mb-6 pl-0 hover:bg-transparent hover:text-primary">
                <ArrowLeft size={18} /> ダッシュボードに戻る
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="space-y-4">
                        <h1 className="text-3xl font-bold">{submission.candidateName}</h1>
                        <p className="text-muted-foreground">
                            応募日時: {new Date(submission.createdAt).toLocaleString()}
                        </p>

                        {submission.candidateInfo && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-secondary/20 p-4 rounded-lg">
                                {formSchema.map(field => (
                                    <div key={field.id}>
                                        <div className="text-xs text-muted-foreground">{field.label}</div>
                                        <div className="font-medium">{submission.candidateInfo[field.id] || "-"}</div>
                                    </div>
                                ))}
                                {/* Fallback for fields not in current schema but in data */}
                                {Object.entries(submission.candidateInfo).map(([key, value]) => {
                                    if (formSchema.find(f => f.id === key)) return null;
                                    return (
                                        <div key={key}>
                                            <div className="text-xs text-muted-foreground">{key}</div>
                                            <div className="font-medium">{value}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="space-y-8">
                        {submission.answers.map((answer, index) => {
                            const question = questions.find((q) => q.id === answer.questionId);
                            return (
                                <div key={index} className="card space-y-4">
                                    <h3 className="font-medium text-lg">
                                        質問 {index + 1}: {question ? question.text : "不明な質問"}
                                    </h3>
                                    <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                                        <video
                                            src={answer.videoUrl}
                                            controls
                                            className="w-full h-full"
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <div className="card sticky top-8 space-y-6">
                        <h2 className="text-xl font-semibold">評価</h2>

                        <div className="space-y-2">
                            <label className="label">ステータス</label>
                            <select
                                value={evaluation.status}
                                onChange={(e) => setEvaluation({ ...evaluation, status: e.target.value })}
                                className="input"
                            >
                                <option value="unreviewed">未レビュー</option>
                                <option value="passed">合格</option>
                                <option value="rejected">不合格</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="label">評価 (5段階)</label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => setEvaluation({ ...evaluation, rating: star })}
                                        className={`p-2 rounded-full transition-colors ${evaluation.rating >= star
                                            ? "text-yellow-400 bg-yellow-400/10"
                                            : "text-muted-foreground hover:bg-white/5"
                                            }`}
                                    >
                                        <Star size={24} fill={evaluation.rating >= star ? "currentColor" : "none"} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="label">メモ</label>
                            <textarea
                                value={evaluation.notes}
                                onChange={(e) => setEvaluation({ ...evaluation, notes: e.target.value })}
                                className="input min-h-[150px] resize-none"
                                placeholder="評価コメントを入力してください..."
                            />
                        </div>

                        <button
                            onClick={saveEvaluation}
                            disabled={saving}
                            className="btn btn-primary w-full"
                        >
                            <Save size={18} /> {saving ? "保存中..." : "評価を保存"}
                        </button>

                        <button
                            onClick={async () => {
                                if (!confirm("候補者に通知メールを送信しますか？")) return;
                                try {
                                    await fetch("/api/notifications", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({
                                            to: "candidate@example.com", // Mock email
                                            subject: "選考結果のお知らせ",
                                            body: `選考結果: ${evaluation.status === 'passed' ? '合格' : evaluation.status === 'rejected' ? '不合格' : '審査中'}`,
                                            candidateId: params.id
                                        }),
                                    });
                                    alert("候補者にメール通知を送信しました！");
                                } catch (e) {
                                    alert("送信に失敗しました");
                                }
                            }}
                            className="btn btn-secondary w-full"
                        >
                            候補者に通知
                        </button>

                        <div className="pt-4 border-t border-white/10">
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="btn btn-ghost text-destructive w-full hover:bg-destructive/10"
                            >
                                <Trash2 size={18} /> {deleting ? "削除中..." : "この応募を削除"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
