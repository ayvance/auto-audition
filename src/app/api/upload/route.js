import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const PUBLIC_UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');
const PRIVATE_UPLOADS_DIR = path.join(process.cwd(), 'data', 'uploads');

// Ensure uploads directory exists
async function ensureDir(dir) {
    try {
        await fs.access(dir);
    } catch {
        await fs.mkdir(dir, { recursive: true });
    }
}

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');
        const type = formData.get('type') || 'private'; // Default to private for security

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // Validate MIME type
        const allowedTypes = ['video/webm', 'video/mp4', 'image/png', 'image/jpeg', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        
        // Get extension from original filename or default to .webm (for video)
        const ext = path.extname(file.name) || '.webm';
        const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
        
        let filepath;
        let url;

        if (type === 'public') {
            await ensureDir(PUBLIC_UPLOADS_DIR);
            filepath = path.join(PUBLIC_UPLOADS_DIR, filename);
            url = `/uploads/${filename}`;
        } else {
            await ensureDir(PRIVATE_UPLOADS_DIR);
            filepath = path.join(PRIVATE_UPLOADS_DIR, filename);
            url = `/api/files/${filename}`;
        }

        await fs.writeFile(filepath, buffer);

        return NextResponse.json({ success: true, url });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
