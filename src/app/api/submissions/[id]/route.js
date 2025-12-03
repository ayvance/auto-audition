import { NextResponse } from 'next/server';
import { getSubmissionById, updateSubmission, deleteSubmission } from "@/lib/storage";
import fs from 'fs/promises';
import path from 'path';

export async function GET(request, { params }) {
    const { id } = await params;
    const submission = await getSubmissionById(id);
    if (!submission) {
        return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }
    return NextResponse.json(submission);
}

export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const updatedSubmission = await updateSubmission(id, body);

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
        const { id } = await params;
        
        // 1. Get submission details to find files
        const submission = await getSubmissionById(id);
        if (!submission) {
            return NextResponse.json({ error: "Submission not found" }, { status: 404 });
        }

        // 2. Collect files to delete
        const filesToDelete = [];
        const PRIVATE_UPLOADS_DIR = path.join(process.cwd(), 'data', 'uploads');
        const PUBLIC_UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

        const addFile = (url) => {
            if (!url) return;
            if (url.startsWith('/api/files/')) {
                const filename = path.basename(url);
                filesToDelete.push(path.join(PRIVATE_UPLOADS_DIR, filename));
            } else if (url.startsWith('/uploads/')) {
                const filename = path.basename(url);
                filesToDelete.push(path.join(PUBLIC_UPLOADS_DIR, filename));
            }
        };

        if (submission.answers) {
            submission.answers.forEach(a => addFile(a.videoUrl));
        }
        addFile(submission.mergedVideoUrl);

        // 3. Delete files
        await Promise.all(filesToDelete.map(async (filepath) => {
            try {
                await fs.unlink(filepath);
                console.log(`Deleted file: ${filepath}`);
            } catch (err) {
                // Ignore if file doesn't exist
                if (err.code !== 'ENOENT') {
                    console.error(`Failed to delete file ${filepath}:`, err);
                }
            }
        }));

        // 4. Delete submission record
        const success = await deleteSubmission(id);

        if (!success) {
            return NextResponse.json({ error: "Failed to delete submission record" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete error:", error);
        return NextResponse.json({ error: "Failed to delete submission" }, { status: 500 });
    }
}
