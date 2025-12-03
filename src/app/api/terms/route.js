import { NextResponse } from "next/server";
import { getTerms, saveTerms } from "@/lib/storage";

export const dynamic = 'force-dynamic';

export async function GET() {
    const terms = await getTerms();
    return NextResponse.json(terms);
}

export async function POST(request) {
    try {
        const body = await request.json();
        const terms = await saveTerms(body);
        return NextResponse.json(terms);
    } catch (error) {
        return NextResponse.json({ error: "Failed to save terms" }, { status: 500 });
    }
}
