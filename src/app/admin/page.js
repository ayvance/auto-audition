"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Trash2, Save, Video, FileText, ChevronRight, Settings, ArrowUp, ArrowDown } from "lucide-react";

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState("questions");

    return (
        <div className="container py-8">
            <header className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold">管理ダッシュボード</h1>
                <div className="flex gap-2">
                    <Link href="/admin/settings" className="btn btn-secondary">
                        <Settings size={18} /> 設定
                    </Link>
                    <Link href="/" className="btn btn-ghost">
                        ホームに戻る
                    </Link>
                </div>
            </header>

            <div className="flex gap-4 mb-8 border-b border-white/10 pb-4 overflow-x-auto">
                <button
                    onClick={() => setActiveTab("questions")}
                    className={`btn whitespace-nowrap ${activeTab === "questions" ? "btn-primary" : "btn-ghost"}`}
                >
                    <FileText size={18} /> 質問管理
                </button>
                <button
                    onClick={() => setActiveTab("form")}
                    className={`btn whitespace-nowrap ${activeTab === "form" ? "btn-primary" : "btn-ghost"}`}
                >
                    <Settings size={18} /> フォーム設定
                </button>
                <button
                    onClick={() => setActiveTab("terms")}
                    className={`btn whitespace-nowrap ${activeTab === "terms" ? "btn-primary" : "btn-ghost"}`}
                >
                    <FileText size={18} /> 面接設定
                </button>
                <button
                    onClick={() => setActiveTab("submissions")}
                    className={`btn whitespace-nowrap ${activeTab === "submissions" ? "btn-primary" : "btn-ghost"}`}
                >
                    <Video size={18} /> 応募一覧
                </button>
            </div>

            {activeTab === "questions" && <QuestionManager />}
            {activeTab === "form" && <FormBuilder />}
            {activeTab === "terms" && <TermsEditor />}
            {activeTab === "submissions" && <SubmissionList />}
        </div>
    );
}

function QuestionManager() {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchQuestions();
    }, []);

    async function fetchQuestions() {
        try {
            const res = await fetch("/api/questions");
            const data = await res.json();
            setQuestions(data || []);
        } catch (error) {
            console.error("Failed to fetch questions", error);
        } finally {
            setLoading(false);
        }
    }

    async function saveQuestions() {
        setSaving(true);
        try {
            await fetch("/api/questions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(questions),
            });
            alert("質問を保存しました！");
        } catch (error) {
            alert("保存に失敗しました");
        } finally {
            setSaving(false);
        }
    }

    function addQuestion() {
        const newQuestion = {
            id: Date.now(),
            text: "新しい質問",
            description: "",
            timeLimit: 60,
        };
        setQuestions([...questions, newQuestion]);
    }

    function updateQuestion(id, field, value) {
        setQuestions(
            questions.map((q) => (q.id === id ? { ...q, [field]: value } : q))
        );
    }

    function removeQuestion(id) {
        setQuestions(questions.filter((q) => q.id !== id));
    }

    function moveQuestion(index, direction) {
        const newQuestions = [...questions];
        const targetIndex = index + direction;

        if (targetIndex < 0 || targetIndex >= newQuestions.length) return;

        [newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]];
        setQuestions(newQuestions);
    }

    if (loading) return <div className="text-center py-12">読み込み中...</div>;

    return (
        <div className="space-y-6 max-w-3xl">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">面接の質問</h2>
                <button onClick={addQuestion} className="btn btn-secondary">
                    <Plus size={18} /> 質問を追加
                </button>
            </div>

            <div className="space-y-4">
                {questions.map((q, index) => (
                    <div key={q.id} className="card flex gap-4 items-start animate-fade-in">
                        <div className="pt-3 text-muted-foreground font-mono">
                            {String(index + 1).padStart(2, "0")}
                        </div>
                        <div className="flex-1 space-y-4 w-full"> {/* Changed space-y-2 to space-y-4 */}
                            <div className="flex flex-col gap-2">
                                <label className="label">質問内容</label>
                                <input
                                    type="text"
                                    value={q.text}
                                    onChange={(e) => updateQuestion(q.id, "text", e.target.value)}
                                    className="input flex-1"
                                    placeholder="例：自己紹介をお願いします..."
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="label">説明文 (読み上げなし)</label>
                                <textarea
                                    value={q.description || ""}
                                    onChange={(e) => updateQuestion(q.id, "description", e.target.value)}
                                    className="input min-h-[80px]"
                                    placeholder="補足説明などを入力してください"
                                />
                            </div>
                            <div className="flex flex-col gap-2 w-full sm:w-32"> {/* Adjusted structure */}
                                <label className="label">制限時間 (秒)</label>
                                <input
                                    type="number"
                                    value={q.timeLimit}
                                    onChange={(e) => updateQuestion(q.id, "timeLimit", parseInt(e.target.value))}
                                    className="input"
                                    min="0"
                                />
                                <p className="text-xs text-muted-foreground mt-1">0で無制限</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 mt-8">
                            <button
                                onClick={() => moveQuestion(index, -1)}
                                disabled={index === 0}
                                className="btn btn-ghost p-2 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <ArrowUp size={18} />
                            </button>
                            <button
                                onClick={() => moveQuestion(index, 1)}
                                disabled={index === questions.length - 1}
                                className="btn btn-ghost p-2 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <ArrowDown size={18} />
                            </button>
                        </div>
                        <button
                            onClick={() => removeQuestion(q.id)}
                            className="btn btn-ghost text-destructive hover:bg-destructive/10 mt-8"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}

                {questions.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground border border-dashed border-white/10 rounded-xl">
                        質問がまだありません。
                    </div>
                )}
            </div>

            <div className="flex justify-end pt-4">
                <button onClick={saveQuestions} disabled={saving} className="btn btn-primary">
                    <Save size={18} /> {saving ? "保存中..." : "変更を保存"}
                </button>
            </div>
        </div>
    );
}

function FormBuilder() {
    const [schema, setSchema] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch("/api/form-schema")
            .then(res => res.json())
            .then(data => {
                setSchema(data);
                setLoading(false);
            });
    }, []);

    async function saveSchema() {
        setSaving(true);
        try {
            await fetch("/api/form-schema", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(schema),
            });
            alert("フォーム設定を保存しました！");
        } catch (error) {
            alert("保存に失敗しました");
        } finally {
            setSaving(false);
        }
    }

    function addField() {
        const id = "field_" + Date.now();
        setSchema([...schema, { id, label: "新しい項目", type: "text", required: false }]);
    }

    function updateField(index, key, value) {
        const newSchema = [...schema];
        newSchema[index] = { ...newSchema[index], [key]: value };
        setSchema(newSchema);
    }

    function removeField(index) {
        const newSchema = [...schema];
        newSchema.splice(index, 1);
        setSchema(newSchema);
    }

    function moveField(index, direction) {
        const newSchema = [...schema];
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= newSchema.length) return;
        [newSchema[index], newSchema[targetIndex]] = [newSchema[targetIndex], newSchema[index]];
        setSchema(newSchema);
    }

    if (loading) return <div>読み込み中...</div>;

    return (
        <div className="space-y-6 max-w-3xl">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">応募者情報フォーム設定</h2>
                <button onClick={addField} className="btn btn-secondary">
                    <Plus size={18} /> 項目を追加
                </button>
            </div>

            <div className="space-y-4">
                {schema.map((field, index) => (
                    <div key={field.id} className="card flex flex-col sm:flex-row gap-4 items-start animate-fade-in">
                        <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="label">ラベル</label>
                                <input
                                    type="text"
                                    value={field.label}
                                    onChange={(e) => updateField(index, "label", e.target.value)}
                                    className="input"
                                />
                            </div>
                            <div>
                                <label className="label">タイプ</label>
                                <select
                                    value={field.type}
                                    onChange={(e) => updateField(index, "type", e.target.value)}
                                    className="input"
                                >
                                    <option value="text">テキスト (1行)</option>
                                    <option value="email">メールアドレス</option>
                                    <option value="tel">電話番号</option>
                                    <option value="textarea">テキスト (複数行)</option>
                                    <option value="radio">ラジオボタン</option>
                                </select>
                            </div>
                            {field.type === "radio" && (
                                <div className="sm:col-span-2">
                                    <label className="label">選択肢 (カンマ区切り)</label>
                                    <input
                                        type="text"
                                        value={field.options || ""}
                                        onChange={(e) => updateField(index, "options", e.target.value)}
                                        className="input"
                                        placeholder="例: 男性, 女性, その他"
                                    />
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={field.required}
                                    onChange={(e) => updateField(index, "required", e.target.checked)}
                                    id={`req_${field.id}`}
                                    className="w-4 h-4"
                                />
                                <label htmlFor={`req_${field.id}`} className="text-sm cursor-pointer">必須項目にする</label>
                            </div>
                        </div>

                        <div className="flex gap-2 self-end sm:self-start">
                            <div className="flex flex-col gap-1">
                                <button
                                    onClick={() => moveField(index, -1)}
                                    disabled={index === 0}
                                    className="btn btn-ghost p-1 h-8 w-8"
                                >
                                    <ArrowUp size={16} />
                                </button>
                                <button
                                    onClick={() => moveField(index, 1)}
                                    disabled={index === schema.length - 1}
                                    className="btn btn-ghost p-1 h-8 w-8"
                                >
                                    <ArrowDown size={16} />
                                </button>
                            </div>
                            <button
                                onClick={() => removeField(index)}
                                className="btn btn-ghost text-destructive hover:bg-destructive/10"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-end pt-4">
                <button onClick={saveSchema} disabled={saving} className="btn btn-primary">
                    <Save size={18} /> {saving ? "保存中..." : "変更を保存"}
                </button>
            </div>
        </div>
    );
}

function TermsEditor() {
    const [terms, setTerms] = useState({
        title: "", content: "", requirements: "", overview: "",
        interviewTitle: "", interviewDescription: "",
        metaTitle: "", metaDescription: "", footerText: ""
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch("/api/terms")
            .then(res => res.json())
            .then(data => {
                setTerms(data);
                setLoading(false);
            });
    }, []);

    async function saveTerms() {
        setSaving(true);
        try {
            await fetch("/api/terms", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(terms),
            });
            alert("規約設定を保存しました！");
        } catch (error) {
            alert("保存に失敗しました");
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <div>読み込み中...</div>;

    return (
        <div className="space-y-6 max-w-3xl">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">面接設定</h2>
            </div>

            <div className="card space-y-4 animate-fade-in">
                <div className="space-y-2">
                    <label className="label">面接タイトル (Welcome画面)</label>
                    <input
                        type="text"
                        value={terms.interviewTitle || ""}
                        onChange={(e) => setTerms({ ...terms, interviewTitle: e.target.value })}
                        className="input"
                        placeholder="例: 面接へようこそ"
                    />
                </div>
                <div className="space-y-2">
                    <label className="label">面接説明文 (Welcome画面)</label>
                    <textarea
                        value={terms.interviewDescription || ""}
                        onChange={(e) => setTerms({ ...terms, interviewDescription: e.target.value })}
                        className="input min-h-[100px]"
                        placeholder="例: これから {count} つの質問にお答えいただきます..."
                    />
                    <p className="text-xs text-muted-foreground">{"{count}"} は質問数に置き換わります。</p>
                </div>
                <div className="space-y-2">
                    <label className="label">規約タイトル</label>
                    <input
                        type="text"
                        value={terms.title}
                        onChange={(e) => setTerms({ ...terms, title: e.target.value })}
                        className="input"
                        placeholder="例: 利用規約"
                    />
                </div>

                <div className="pt-4 border-t border-white/10">
                    <h3 className="text-lg font-semibold mb-4">サイト設定</h3>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="label">ページタイトル (ブラウザタブ)</label>
                            <input
                                type="text"
                                value={terms.metaTitle || ""}
                                onChange={(e) => setTerms({ ...terms, metaTitle: e.target.value })}
                                className="input"
                                placeholder="例: Auto Audition | 自動面接システム"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="label">説明文 (SEO)</label>
                            <textarea
                                value={terms.metaDescription || ""}
                                onChange={(e) => setTerms({ ...terms, metaDescription: e.target.value })}
                                className="input min-h-[80px]"
                                placeholder="サイトの説明文を入力してください..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="label">フッター (コピーライト)</label>
                            <input
                                type="text"
                                value={terms.footerText || ""}
                                onChange={(e) => setTerms({ ...terms, footerText: e.target.value })}
                                className="input"
                                placeholder="例: &copy; {year} Auto Audition System"
                            />
                            <p className="text-xs text-muted-foreground">{"{year}"} は現在の西暦に置き換わります。</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="label">募集概要</label>
                    <textarea
                        value={terms.overview || ""}
                        onChange={(e) => setTerms({ ...terms, overview: e.target.value })}
                        className="input min-h-[100px] font-mono text-sm"
                        placeholder="募集の概要を入力してください..."
                    />
                </div>
                <div className="space-y-2">
                    <label className="label">利用規約・注意事項</label>
                    <textarea
                        value={terms.content}
                        onChange={(e) => setTerms({ ...terms, content: e.target.value })}
                        className="input min-h-[200px] font-mono text-sm"
                        placeholder="規約や注意事項を入力してください..."
                    />
                </div>
                <div className="space-y-2">
                    <label className="label">応募条件</label>
                    <textarea
                        value={terms.requirements || ""}
                        onChange={(e) => setTerms({ ...terms, requirements: e.target.value })}
                        className="input min-h-[150px] font-mono text-sm"
                        placeholder="応募に必要な条件を入力してください..."
                    />
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button onClick={saveTerms} disabled={saving} className="btn btn-primary">
                    <Save size={18} /> {saving ? "保存中..." : "変更を保存"}
                </button>
            </div>
        </div>
    );
}

function SubmissionList() {
    const [submissions, setSubmissions] = useState([]);
    const [filteredSubmissions, setFilteredSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all"); // all, unreviewed, passed, rejected
    const [sort, setSort] = useState("newest"); // newest, oldest

    useEffect(() => {
        fetchSubmissions();
    }, []);

    async function fetchSubmissions() {
        try {
            const res = await fetch("/api/submissions");
            const data = await res.json();
            setSubmissions(data || []);
            setFilteredSubmissions(data || []);
        } catch (error) {
            console.error("Failed to fetch submissions", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        let result = [...submissions];

        // Filter
        if (filter !== "all") {
            result = result.filter(s => {
                const status = s.evaluation?.status || s.status || "unreviewed";
                return status === filter;
            });
        }

        // Sort
        result.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return sort === "newest" ? dateB - dateA : dateA - dateB;
        });

        setFilteredSubmissions(result);
    }, [submissions, filter, sort]);

    if (loading) return <div className="text-center py-12">読み込み中...</div>;

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <h2 className="text-xl font-semibold">応募者一覧</h2>
                <div className="flex gap-2">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="input py-1 px-3 text-sm w-auto"
                    >
                        <option value="all">全て</option>
                        <option value="unreviewed">未レビュー</option>
                        <option value="passed">合格</option>
                        <option value="rejected">不合格</option>
                    </select>
                    <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                        className="input py-1 px-3 text-sm w-auto"
                    >
                        <option value="newest">新しい順</option>
                        <option value="oldest">古い順</option>
                    </select>
                </div>
            </div>
            <div className="grid gap-4">
                {filteredSubmissions.map((s) => (
                    <Link key={s.id} href={`/admin/submissions/${s.id}`}>
                        <div className="card hover:border-primary/50 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between group gap-4">
                            <div>
                                <h3 className="font-semibold text-lg">{s.candidateName || "匿名候補者"}</h3>
                                <p className="text-sm text-muted-foreground">
                                    応募日時: {new Date(s.createdAt).toLocaleString()}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors self-end sm:self-auto">
                                詳細を見る <ChevronRight size={18} />
                            </div>
                        </div>
                    </Link>
                ))}

                {filteredSubmissions.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground border border-dashed border-white/10 rounded-xl">
                        まだ応募がありません。
                    </div>
                )}
            </div>
        </div>
    );
}
