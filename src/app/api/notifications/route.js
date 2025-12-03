import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const NOTIFICATIONS_FILE = path.join(DATA_DIR, "notifications.json");

async function ensureDirs() {
    try {
        await fs.access(DATA_DIR);
    } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
    }
}

async function getNotifications() {
    await ensureDirs();
    try {
        const data = await fs.readFile(NOTIFICATIONS_FILE, "utf-8");
        return JSON.parse(data);
    } catch {
        return [];
    }
}

async function saveNotification(notification) {
    const notifications = await getNotifications();
    notifications.unshift({
        id: Date.now().toString(),
        sentAt: new Date().toISOString(),
        ...notification,
    });
    await fs.writeFile(NOTIFICATIONS_FILE, JSON.stringify(notifications, null, 2));
    return notifications[0];
}

export async function GET() {
    const notifications = await getNotifications();
    return NextResponse.json(notifications);
}

export async function POST(request) {
    try {
        const body = await request.json();
        const notification = await saveNotification(body);
        return NextResponse.json({ success: true, notification });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Failed to send notification" }, { status: 500 });
    }
}
