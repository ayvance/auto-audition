import { NextResponse } from 'next/server';
import { getSubmissionById, updateSubmission } from "@/lib/storage";
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import ffprobePath from 'ffprobe-static';
import path from 'path';
import fs from 'fs';

// Properly setup ffmpeg/ffprobe paths depending on the environment
if (ffmpegPath) {
    ffmpeg.setFfmpegPath(ffmpegPath);
} else {
    // Fallback: try to find it in node_modules if not automatically resolved (e.g. Next.js bundling issues)
    // or assume it's in the system path
    const manualPath = path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg');
    if (fs.existsSync(manualPath)) {
        ffmpeg.setFfmpegPath(manualPath);
    }
}

if (ffprobePath && ffprobePath.path) {
    ffmpeg.setFfprobePath(ffprobePath.path);
} else if (typeof ffprobePath === 'string') {
    ffmpeg.setFfprobePath(ffprobePath);
} else {
    // Fallback for ffprobe-static which often needs help in some bundlers
    // The previous code hardcoded darwin/arm64, which is wrong for Linux.
    // ffprobe-static binary location varies by platform.
    // However, the best practice is to rely on the package export.
    // If that fails, we shouldn't force a wrong path.
    // We can try to guess based on process.platform if absolutely necessary,
    // but typically ffprobe-static's export is correct.
    // If it's undefined, it might mean the platform isn't supported by the static package,
    // in which case we hope for a system-installed ffprobe.

    // For debugging
    console.log("ffprobe-static path was not resolved automatically.");
}

console.log("API Route - ffmpegPath:", ffmpegPath);
console.log("API Route - ffprobePath:", ffprobePath);

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

        const concatListFilename = `concat-${id}-${Date.now()}.txt`;
        const concatListPath = path.join(TMP_DIR, concatListFilename);
        
        // Create ffmpeg concat list format
        // file '/path/to/file1'
        // file '/path/to/file2'
        const concatContent = videoFiles.map(f => `file '${f}'`).join('\n');
        await fs.promises.writeFile(concatListPath, concatContent);

        await new Promise((resolve, reject) => {
            const command = ffmpeg();

            command
                .input(concatListPath)
                .inputOptions(['-f concat', '-safe 0'])
                .outputOptions('-c copy') // Try to copy stream for speed
                .on('error', (err) => {
                    console.error('An error occurred: ' + err.message);
                    reject(err);
                })
                .on('end', () => {
                    console.log('Merging finished !');
                    // Clean up concat list file
                    fs.promises.unlink(concatListPath).catch(console.error);
                    resolve();
                })
                .save(outputPath);
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
