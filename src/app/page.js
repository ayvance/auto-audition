import Link from "next/link";
import { Mic, Video, ArrowRight } from "lucide-react";
import { getTerms, getQuestions } from "@/lib/storage";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const terms = await getTerms();
  const questions = await getQuestions();

  const description = (terms.interviewDescription || "これから {count} つの質問にお答えいただきます。\n候補者は自分のペースで回答を録画でき、いつでもレビューが可能です。")
    .replace("{count}", questions.length);
  return (
    <div className="container flex flex-col items-center justify-center min-h-screen py-12 text-center">
      <div className="animate-fade-in space-y-8 max-w-2xl">
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="p-4 rounded-full bg-primary/20 text-primary border border-primary/30">
            <Video size={32} />
          </div>
          <div className="p-4 rounded-full bg-accent/20 text-accent border border-accent/30">
            <Mic size={32} />
          </div>
        </div>

        <h1
          className="text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400"
          style={{ textWrap: "balance" }}
        >
          {terms.interviewTitle || "自動面接オーディション"}
        </h1>

        <p
          className="text-xl text-muted-foreground leading-relaxed whitespace-pre-wrap"
          style={{ textWrap: "balance" }}
        >
          {description}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
          <Link href="/interview" className="btn btn-primary text-lg px-8 py-4 h-auto">
            面接を始める <ArrowRight size={20} />
          </Link>
        </div>
      </div>

    </div>
  );
}
