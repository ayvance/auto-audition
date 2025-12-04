import { NextResponse } from 'next/server';
import { getSubmissionById, updateSubmission } from "@/lib/storage";
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import ffprobePath from 'ffprobe-static';
import path from 'path';
import fs from 'fs';

// Manually resolve paths because Next.js/Turbopack resolves them to /ROOT/...
const ffmpegBinary = path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg');
const ffprobeBinary = path.join(process.cwd(), 'node_modules', 'ffprobe-static', 'bin', 'darwin', 'arm64', 'ffprobe');

ffmpeg.setFfmpegPath(ffmpegBinary);
ffmpeg.setFfprobePath(ffprobeBinary);

console.log("API Route - ffmpegPath:", ffmpegBinary);
console.log("API Route - ffprobePath:", ffprobeBinary);

export async function POST(request, { params }) {
    try {
        const { id } = await params;
        const submission = await getSubmissionById(id);

        if (!submission) {
            return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
        }

        const PRIVATE_UPLOADS_DIR = path.join(process.cwd(), 'data', 'uploads');
        const TMP_DIR = path.join(process.cwd(), 'tmp');
        try {
            await fs.promises.access(PRIVATE_UPLOADS_DIR);
            await fs.promises.access(TMP_DIR);
        } catch {
            await fs.promises.mkdir(PRIVATE_UPLOADS_DIR, { recursive: true });
            await fs.promises.mkdir(TMP_DIR, { recursive: true });
        }

        const videoFiles = submission.answers
            .map(a => a.videoUrl)
            .filter(url => url)
            .map(url => {
                // Convert URL (/uploads/...) to file path (data/uploads/...)
                // Assuming url starts with /api/files/
                const filename = path.basename(url);
                return path.join(PRIVATE_UPLOADS_DIR, filename);
            });

        if (videoFiles.length === 0) {
            return NextResponse.json({ error: 'No videos to merge' }, { status: 400 });
        }

        const outputFilename = `merged-${id}-${Date.now()}.webm`;
        const outputPath = path.join(PRIVATE_UPLOADS_DIR, outputFilename);
        const publicUrl = `/api/files/${outputFilename}`;

        await new Promise((resolve, reject) => {
            const command = ffmpeg();

            videoFiles.forEach(file => {
                command.input(file);
            });

            command
                .on('error', (err) => {
                    console.error('An error occurred: ' + err.message);
                    reject(err);
                })
                .on('end', () => {
                    console.log('Merging finished !');
                    resolve();
                })
                .mergeToFile(outputPath, TMP_DIR, () => {}); // Add dummy callback and use TMP_DIR variable
        });

        // Update submission with merged video URL
        const updatedSubmission = await updateSubmission(id, {
            mergedVideoUrl: publicUrl
        });

        return NextResponse.json({ success: true, url: publicUrl, submission: updatedSubmission });

    } catch (error) {
        console.error("Merge failed", error);
        return NextResponse.json({ error: 'Failed to merge videos: ' + error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = await params;
        const submission = await getSubmissionById(id);

        if (!submission) {
            return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
        }

        if (!submission.mergedVideoUrl) {
            return NextResponse.json({ error: 'No merged video to delete' }, { status: 400 });
        }

        const PRIVATE_UPLOADS_DIR = path.join(process.cwd(), 'data', 'uploads');
        const filename = path.basename(submission.mergedVideoUrl);
        const filepath = path.join(PRIVATE_UPLOADS_DIR, filename);

        // Delete file
        try {
            await fs.promises.unlink(filepath);
        } catch (err) {
            console.error("Failed to delete merged video file:", err);
            // Continue to update submission even if file delete fails (maybe already gone)
        }

        // Update submission
        const updatedSubmission = await updateSubmission(id, {
            mergedVideoUrl: null
        });

        return NextResponse.json({ success: true, submission: updatedSubmission });

    } catch (error) {
        console.error("Delete merged video failed", error);
        return NextResponse.json({ error: 'Failed to delete merged video: ' + error.message }, { status: 500 });
    }
}
