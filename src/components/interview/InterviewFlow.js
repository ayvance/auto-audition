"use client";

import { useState, useEffect } from "react";
import { Mic, Video, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import Recorder from "./Recorder";
import QuestionReader from "./QuestionReader";
import { useRouter } from "next/navigation";

export default function InterviewFlow() {
    const router = useRouter();
    const [step, setStep] = useState("terms"); // terms, welcome, check, interview, finish
    const [questions, setQuestions] = useState([]);
    const [formSchema, setFormSchema] = useState([]);
    const [terms, setTerms] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState([]);
    const [candidateInfo, setCandidateInfo] = useState({});
    const [consent, setConsent] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        try {
            const [qRes, fRes, tRes] = await Promise.all([
                fetch("/api/questions"),
                fetch("/api/form-schema"),
                fetch("/api/terms")
            ]);
            const qData = await qRes.json();
            const fData = await fRes.json();
            const tData = await tRes.json();
            setQuestions(qData || []);
            setFormSchema(fData || []);
            setTerms(tData);

            // Initialize candidateInfo with empty strings for each field
            const initialInfo = {};
            (fData || []).forEach(field => {
                initialInfo[field.id] = "";
            });
            setCandidateInfo(initialInfo);
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    }

    function handleStart() {
        // Validate required fields
        for (const field of formSchema) {
            if (field.required && !candidateInfo[field.id]?.trim()) {
                alert(`${field.label}を入力してください`);
                return;
            }
        }
        // Consent is now handled in the terms step
        setStep("check");
    }

    function handleTermsAgree() {
        setStep("welcome");
    }

    function handleCheckComplete() {
        setStep("interview");
    }

    async function handleAnswerComplete(videoUrl, transcript) {
        const currentQuestion = questions[currentQuestionIndex];
        const newAnswers = [
            ...answers,
            {
                questionId: currentQuestion.id,
                videoUrl,
                transcript,
            },
        ];
        setAnswers(newAnswers);

        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            await submitInterview(newAnswers);
        }
    }

    async function submitInterview(finalAnswers) {
        setSubmitting(true);
        try {
            await fetch("/api/submissions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    candidateInfo,
                    answers: finalAnswers,
                }),
            });
            setStep("finish");
        } catch (error) {
            console.error("Submission failed", error);
            alert("送信に失敗しました。もう一度お試しください。");
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) return <div>読み込み中...</div>;

    if (step === "terms") {
        return (
            <div className="max-w-2xl w-full space-y-8 animate-fade-in">
                <div className="text-center space-y-4">
                    <h1 className="text-3xl font-bold">{terms?.title || "利用規約"}</h1>
                    <p className="text-muted-foreground">
                        面接を始める前に、以下の内容をご確認ください。
                    </p>
                </div>

                <div className="card space-y-6 p-6 sm:p-8">
                    {terms?.overview && (
                        <div className="space-y-2">
                            <h3 className="font-semibold text-lg">募集概要</h3>
                            <div className="bg-secondary/30 p-4 rounded-lg max-h-[200px] overflow-y-auto whitespace-pre-wrap text-sm border border-white/10">
                                {terms.overview}
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <h3 className="font-semibold text-lg">利用規約・注意事項</h3>
                        <div className="bg-secondary/30 p-4 rounded-lg max-h-[300px] overflow-y-auto whitespace-pre-wrap text-sm border border-white/10">
                            {terms?.content || "規約の読み込みに失敗しました。"}
                        </div>
                    </div>

                    {terms?.requirements && (
                        <div className="space-y-2">
                            <h3 className="font-semibold text-lg">応募条件</h3>
                            <div className="bg-secondary/30 p-4 rounded-lg max-h-[200px] overflow-y-auto whitespace-pre-wrap text-sm border border-white/10">
                                {terms.requirements}
                            </div>
                        </div>
                    )}

                    <div className="flex items-start gap-3 p-4 border border-white/10 rounded-lg bg-black/20">
                        <input
                            type="checkbox"
                            id="terms_consent"
                            checked={consent}
                            onChange={(e) => setConsent(e.target.checked)}
                            className="mt-1 w-5 h-5 rounded border-white/20 bg-black/50 checked:bg-primary"
                        />
                        <label htmlFor="terms_consent" className="text-sm text-muted-foreground cursor-pointer select-none">
                            <span className="text-foreground font-medium">上記の内容に同意します。</span>
                        </label>
                    </div>

                    <button
                        onClick={handleTermsAgree}
                        disabled={!consent}
                        className="btn btn-primary w-full text-lg py-4 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        次へ <ArrowRight size={20} />
                    </button>
                </div>
            </div>
        );
    }

    if (step === "welcome") {
        return (
            <div className="max-w-md w-full space-y-8 animate-fade-in">
                <div className="text-center space-y-4">
                    <h1 className="text-3xl font-bold" style={{ textWrap: "balance" }}>{terms?.interviewTitle || "面接へようこそ"}</h1>
                    <p
                        className="text-muted-foreground whitespace-pre-wrap"
                        style={{ textWrap: "balance" }}
                    >
                        {(terms?.interviewDescription || "これから {count} つの質問にお答えいただきます。\n静かな環境で実施してください。").replace("{count}", questions.length)}
                    </p>
                </div>

                <div className="card space-y-6 p-6 sm:p-8">
                    <div className="space-y-4">
                        {formSchema.map((field) => (
                            <div key={field.id} className="space-y-2">
                                <label className="label">
                                    {field.label}
                                    {field.required && <span className="text-red-500 ml-1">*</span>}
                                </label>
                                {field.type === "textarea" ? (
                                    <textarea
                                        value={candidateInfo[field.id] || ""}
                                        onChange={(e) => setCandidateInfo({ ...candidateInfo, [field.id]: e.target.value })}
                                        className="input min-h-[100px]"
                                        placeholder={`${field.label}を入力してください`}
                                    />
                                ) : field.type === "radio" ? (
                                    <div className="flex flex-wrap gap-4">
                                        {(field.options || "").split(",").map((option) => {
                                            const opt = option.trim();
                                            return (
                                                <label key={opt} className="flex items-center gap-2 cursor-pointer bg-secondary/30 px-4 py-2 rounded-lg hover:bg-secondary/50 transition-colors">
                                                    <input
                                                        type="radio"
                                                        name={field.id}
                                                        value={opt}
                                                        checked={candidateInfo[field.id] === opt}
                                                        onChange={(e) => setCandidateInfo({ ...candidateInfo, [field.id]: e.target.value })}
                                                        className="w-4 h-4 text-primary"
                                                    />
                                                    <span>{opt}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <input
                                        type={field.type}
                                        value={candidateInfo[field.id] || ""}
                                        onChange={(e) => setCandidateInfo({ ...candidateInfo, [field.id]: e.target.value })}
                                        className="input text-lg py-3"
                                        placeholder={`${field.label}を入力してください`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="space-y-4 text-sm text-muted-foreground bg-secondary/50 p-4 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-full text-primary">
                                <Video size={20} />
                            </div>
                            <span>カメラ録画が必要です</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-full text-primary">
                                <Mic size={20} />
                            </div>
                            <span>音声録音が必要です</span>
                        </div>
                    </div>

                    <button
                        onClick={handleStart}
                        className="btn btn-primary w-full text-lg py-4 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        次へ <ArrowRight size={20} />
                    </button>
                </div>
            </div>
        );
    }

    if (step === "check") {
        return (
            <div className="max-w-2xl w-full space-y-8 animate-fade-in">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">デバイスチェック</h2>
                    <p className="text-muted-foreground">
                        カメラとマイクが正常に動作しているか確認してください。
                    </p>
                </div>

                <div className="card p-1">
                    {/* We'll pass a 'check' mode to Recorder to just show the preview */}
                    <Recorder mode="check" onComplete={handleCheckComplete} />
                </div>
            </div>
        );
    }

    if (step === "interview") {
        const question = questions[currentQuestionIndex];
        return (
            <div className="max-w-6xl w-full space-y-8 animate-fade-in">
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>質問 {currentQuestionIndex + 1} / {questions.length}</span>
                    <span>{Math.round(((currentQuestionIndex) / questions.length) * 100)}% 完了</span>
                </div>

                <div className="w-full bg-secondary h-1 rounded-full overflow-hidden">
                    <div
                        className="bg-primary h-full transition-all duration-500"
                        style={{ width: `${((currentQuestionIndex) / questions.length) * 100}%` }}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
                    {/* Left Column: Question Info */}
                    <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">
                        <div className="card h-full flex flex-col justify-center space-y-6 p-6 lg:p-8">
                            <div className="space-y-4">
                                <h2 className="text-2xl lg:text-3xl font-bold leading-tight">{question.text}</h2>
                                {question.description && (
                                    <div className="max-h-[200px] overflow-y-auto pr-2">
                                        <p className="text-muted-foreground whitespace-pre-wrap text-lg">{question.description}</p>
                                    </div>
                                )}
                            </div>
                            <div className="pt-4 border-t border-white/10">
                                <QuestionReader text={question.text} settings={terms?.tts} />
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Recorder */}
                    <div className="lg:col-span-3 order-1 lg:order-2">
                        <div className="card p-1 overflow-hidden bg-black/40 border-white/10">
                            <div className="aspect-video bg-black rounded-lg overflow-hidden relative shadow-2xl">
                                <Recorder
                                    key={question.id} // Reset recorder for each question
                                    mode="record"
                                    timeLimit={question.timeLimit}
                                    onComplete={handleAnswerComplete}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (step === "finish") {
        return (
            <div className="max-w-md w-full text-center space-y-6 animate-fade-in">
                <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle size={40} />
                </div>
                <h1 className="text-3xl font-bold">面接終了！</h1>
                <p className="text-muted-foreground">
                    お時間をいただきありがとうございました。回答は正常に送信されました。
                    確認後、ご連絡いたします。
                </p>
                <button onClick={() => router.push("/")} className="btn btn-secondary">
                    ホームに戻る
                </button>
            </div>
        );
    }

    return null;
}
