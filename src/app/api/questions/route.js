import { NextResponse } from 'next/server';
import { getQuestions, saveQuestions } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET() {
    const questions = await getQuestions();
    return NextResponse.json(questions);
}

export async function POST(request) {
    try {
        const body = await request.json();
        // Validate body if needed (e.g., array of questions)
        await saveQuestions(body);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to save questions' }, { status: 500 });
    }
}
