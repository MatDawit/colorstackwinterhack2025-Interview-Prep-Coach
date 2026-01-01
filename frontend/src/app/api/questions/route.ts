import {NextResponse} from "next/server";
import path from "path";
import fs from "fs/promises";

export async function GET() {

    //process.cwd() points to /frontend
    const repoRoot = path.resolve(process.cwd(), ".."); // frontend -> repo root
    const filePath = path.join(repoRoot, "backend", "prisma", "questions.json");

    const raw = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(raw);

    return NextResponse.json(data);
}