import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const PRIVATE_UPLOADS_DIR = path.join(process.cwd(), 'data', 'uploads');
const SECRET_KEY = new TextEncoder().encode(
    process.env.JWT_SECRET || "default-secret-key-change-in-production"
);

import { getTerms } from "@/lib/storage";

export async function GET(request, { params }) {
    const { filename } = await params;

    // 1. Check if public file (Active Logo or OG Image or Favicon)
    const terms = await getTerms();
    const isPublicLogo = terms.logoUrl && terms.logoUrl.endsWith(filename);
    const isPublicOgImage = terms.ogImageUrl && terms.ogImageUrl.endsWith(filename);
    const isPublicFavicon = terms.faviconUrl && terms.faviconUrl.endsWith(filename);

    if (!isPublicLogo && !isPublicOgImage && !isPublicFavicon) {
        // 2. Verify Auth for private files
        const cookieStore = await cookies();
        const token = cookieStore.get("admin_token")?.value;

        if (!token) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        try {
            await jwtVerify(token, SECRET_KEY);
        } catch (error) {
            return new NextResponse("Unauthorized", { status: 401 });
        }
    }

    // 2. Serve File
    try {
        const { filename } = await params;
        const filepath = path.join(PRIVATE_UPLOADS_DIR, filename);

        // Prevent directory traversal
        if (!filepath.startsWith(PRIVATE_UPLOADS_DIR)) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const fileBuffer = await fs.readFile(filepath);
        const ext = path.extname(filename).toLowerCase();
        
        let contentType = "application/octet-stream";
        if (ext === ".webm") contentType = "video/webm";
        if (ext === ".mp4") contentType = "video/mp4";
        if (ext === ".png") contentType = "image/png";
        if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
        if (ext === ".gif") contentType = "image/gif";
        if (ext === ".webp") contentType = "image/webp";
        if (ext === ".svg") contentType = "image/svg+xml";
        if (ext === ".ico") contentType = "image/x-icon";

        return new NextResponse(fileBuffer, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "private, max-age=3600",
            },
        });
    } catch (error) {
        console.error("File serve error:", error);
        return new NextResponse("File not found", { status: 404 });
    }
}
