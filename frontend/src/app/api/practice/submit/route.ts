import { NextResponse } from "next/server";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import OpenAI from "openai";
import fsSync from "fs";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
    const form = await request.formData();

    console.log("FORM KEYS:", Array.from(form.keys()));
    //the variables below will hold the data sent from the frontend
    //const {interviewType, questionId, question, mode, answerText} = await request.json();
    const interviewType = form.get("interviewType") as string;
    const questionId = form.get("questionId") as string;
    const question = form.get("question") as string;
    const mode = form.get("mode") as string;
    //const answerText = form.get("answerText") as string;

    //creates a unique session id for this submission
    const sessionId = crypto.randomUUID();


    if (mode === "type") {
        const answerText = form.get("answerText") as string;

        if (!answerText || answerText.trim() === "") {
            return NextResponse.json({ error: "Answer cannot be empty." }, { status: 400 });
        }

        return NextResponse.json({
            ok: true,
            sessionId,
            received: {
                interviewType,
                questionId,
                question,
                mode,
                answerText
            }
        });
    }

    const audioFile = form.get("audio") as File | null;
    console.log("AUDIO FILE:", audioFile ? {
        name: audioFile.name,
        type: audioFile.type,
        size: audioFile.size,
    } : null);
    if (!audioFile) {
        return NextResponse.json({ error: "Audio file is required." }, { status: 400 });
    }
    //save the audio file to the server
    const bytes = await audioFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // const uploadsDir = path.join(process.cwd(), "uploads");
    // await fs.mkdir(uploadsDir, { recursive: true });

    // const filePath = path.join(uploadsDir, `${sessionId}.webm`);
    // await fs.writeFile(filePath, buffer);
    const repoRoot = path.resolve(process.cwd(), ".."); // goes from frontend -> repo root
    const uploadsDir = path.join(repoRoot, "backend", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    const filePath = path.join(uploadsDir, `${sessionId}.webm`);
    await fs.writeFile(filePath, buffer);

    const transcription = await openai.audio.transcriptions.create({
    file: fsSync.createReadStream(filePath),
    model: "whisper-1",
    });

    const transcriptText = transcription.text;


    console.log("Saved audio to:", filePath);
    console.log("OPENAI KEY LOADED?", !!process.env.OPENAI_API_KEY);

    return NextResponse.json({
        ok: true,
        sessionId,
        savedTo: filePath,
        transcript: transcriptText,
    });
}
