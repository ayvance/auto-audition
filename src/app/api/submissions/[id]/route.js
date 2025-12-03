import { NextResponse } from 'next/server';
import { getSubmissionById, updateSubmission, deleteSubmission } from "@/lib/storage";

export async function GET(request, { params }) {
    const submission = await getSubmissionById(params.id);
    if (!submission) {
        return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }
    return NextResponse.json(submission);
}

export async function PUT(request, { params }) {
    try {
        const body = await request.json();
        const updatedSubmission = await updateSubmission(params.id, body);

        if (!updatedSubmission) {
            return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
        }

        return NextResponse.json(updatedSubmission);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const success = await deleteSubmission(params.id);

        if (!success) {
            return NextResponse.json({ error: "Submission not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete submission" }, { status: 500 });
    }
}
