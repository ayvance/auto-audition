import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const dynamic = 'force-dynamic';

const DATA_DIR = path.join(process.cwd(), "data");
const SCHEMA_FILE = path.join(DATA_DIR, "form-schema.json");

const DEFAULT_SCHEMA = [
    { id: "name", label: "お名前", type: "text", required: true },
];

async function ensureDirs() {
    try {
        await fs.access(DATA_DIR);
    } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
    }
}

async function getSchema() {
    await ensureDirs();
    try {
        const data = await fs.readFile(SCHEMA_FILE, "utf-8");
        return JSON.parse(data);
    } catch {
        // Write default if not exists
        await fs.writeFile(SCHEMA_FILE, JSON.stringify(DEFAULT_SCHEMA, null, 2));
        return DEFAULT_SCHEMA;
    }
}

async function saveSchema(schema) {
    await ensureDirs();
    await fs.writeFile(SCHEMA_FILE, JSON.stringify(schema, null, 2));
    return schema;
}

export async function GET() {
    const schema = await getSchema();
    return NextResponse.json(schema);
}

export async function POST(request) {
    try {
        const body = await request.json();
        const schema = await saveSchema(body);
        return NextResponse.json(schema);
    } catch (error) {
        return NextResponse.json({ error: "Failed to save schema" }, { status: 500 });
    }
}
