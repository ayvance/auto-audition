const fs = require('fs');
const path = require('path');

const PUBLIC_UPLOADS_DIR = path.join(__dirname, '../public/uploads');
const PRIVATE_UPLOADS_DIR = path.join(__dirname, '../data/uploads');
const SUBMISSIONS_FILE = path.join(__dirname, '../data/submissions.json');

// Ensure private dir exists
if (!fs.existsSync(PRIVATE_UPLOADS_DIR)) {
    fs.mkdirSync(PRIVATE_UPLOADS_DIR, { recursive: true });
}

function migrate() {
    if (!fs.existsSync(SUBMISSIONS_FILE)) {
        console.log('No submissions file found.');
        return;
    }

    const submissions = JSON.parse(fs.readFileSync(SUBMISSIONS_FILE, 'utf-8'));
    let updatedCount = 0;
    let movedCount = 0;

    submissions.forEach(submission => {
        let modified = false;

        // Migrate Answers
        if (submission.answers) {
            submission.answers.forEach(answer => {
                if (answer.videoUrl && answer.videoUrl.startsWith('/uploads/')) {
                    const filename = path.basename(answer.videoUrl);
                    const oldPath = path.join(PUBLIC_UPLOADS_DIR, filename);
                    const newPath = path.join(PRIVATE_UPLOADS_DIR, filename);

                    if (fs.existsSync(oldPath)) {
                        fs.renameSync(oldPath, newPath);
                        movedCount++;
                        console.log(`Moved: ${filename}`);
                    } else if (fs.existsSync(newPath)) {
                        console.log(`Already moved: ${filename}`);
                    } else {
                        console.warn(`File not found: ${filename}`);
                    }

                    answer.videoUrl = `/api/files/${filename}`;
                    modified = true;
                }
            });
        }

        // Migrate Merged Video
        if (submission.mergedVideoUrl && submission.mergedVideoUrl.startsWith('/uploads/')) {
            const filename = path.basename(submission.mergedVideoUrl);
            const oldPath = path.join(PUBLIC_UPLOADS_DIR, filename);
            const newPath = path.join(PRIVATE_UPLOADS_DIR, filename);

            if (fs.existsSync(oldPath)) {
                fs.renameSync(oldPath, newPath);
                movedCount++;
                console.log(`Moved merged video: ${filename}`);
            } else if (fs.existsSync(newPath)) {
                console.log(`Already moved merged video: ${filename}`);
            } else {
                console.warn(`File not found: ${filename}`);
            }

            submission.mergedVideoUrl = `/api/files/${filename}`;
            modified = true;
        }

        if (modified) updatedCount++;
    });

    if (updatedCount > 0) {
        fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(submissions, null, 2));
        console.log(`Updated ${updatedCount} submissions.`);
        console.log(`Moved ${movedCount} files.`);
    } else {
        console.log('No submissions needed migration.');
    }
}

migrate();
