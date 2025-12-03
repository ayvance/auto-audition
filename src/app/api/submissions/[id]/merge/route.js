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
        try {
            await fs.access(PRIVATE_UPLOADS_DIR);
        } catch {
            await fs.mkdir(PRIVATE_UPLOADS_DIR, { recursive: true });
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
                .mergeToFile(absoluteOutputPath, path.join(process.cwd(), 'tmp')); // tmp dir for intermediate files
        });

        // Update submission with merged video URL
        const updatedSubmission = await updateSubmission(id, {
            mergedVideoUrl: publicOutputPath
        });

        return NextResponse.json({ success: true, url: publicOutputPath, submission: updatedSubmission });

    } catch (error) {
        console.error("Merge failed", error);
        return NextResponse.json({ error: 'Failed to merge videos: ' + error.message }, { status: 500 });
    }
}
