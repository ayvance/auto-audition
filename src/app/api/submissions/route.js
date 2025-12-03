import { NextResponse } from 'next/server';
import { getSubmissions, saveSubmission } from '@/lib/storage';

export async function GET() {
    const submissions = await getSubmissions();
    return NextResponse.json(submissions);
}

export async function POST(request) {
    try {
        const body = await request.json();
        // body should contain: candidateInfo, answers
        // Map candidateInfo to candidateName for backward compatibility if needed, or just store as is.
        // We'll store candidateInfo. The storage helper might expect candidateName for listing?
        // Let's check storage.js... actually storage.js just pushes the object.
        // But we should ensure candidateName exists for the list view if we want to keep it simple,
        // or update the list view to look at candidateInfo.
        // For robustness, let's extract a display name from candidateInfo (first field or 'name' field).

        let candidateName = "Unknown";
        if (body.candidateInfo) {
            // Try to find a field with 'name' in id, or just take the first value
            const info = body.candidateInfo;
            const nameKey = Object.keys(info).find(k => k.toLowerCase().includes('name')) || Object.keys(info)[0];
            if (nameKey) candidateName = info[nameKey];
        } else if (body.candidateName) {
            candidateName = body.candidateName;
        }

        const submissionData = {
            ...body,
            candidateName, // explicit field for easier listing
        };

        const newSubmission = await saveSubmission(submissionData);
        return NextResponse.json({ success: true, submission: newSubmission });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to save submission' }, { status: 500 });
    }
}
