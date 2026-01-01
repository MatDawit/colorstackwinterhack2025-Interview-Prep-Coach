import { NextResponse } from "next/server";
import crypto from "crypto";
import { GoogleGenAI } from "@google/genai";
import path from "path";
import fs from "fs/promises";

export async function POST(request: Request) {
  const form = await request.formData();

  const interviewType = String(form.get("interviewType") ?? "");
  const questionId = String(form.get("questionId") ?? "");
  const question = String(form.get("question") ?? "");
  const mode = String(form.get("mode") ?? "");

  const sessionId = crypto.randomUUID();

  // Find repo root (because Next runs from /frontend)
  const repoRoot = path.resolve(process.cwd(), ".."); // frontend -> repo root
  const uploadsDir = path.join(repoRoot, "backend", "uploads");

  // Make sure backend/uploads exists
  await fs.mkdir(uploadsDir, { recursive: true });

  // This will hold the final text we want to save
  let finalAnswerText = "";

  // 1) If user TYPED answer
  if (mode === "type") {
    const answerText = String(form.get("answerText") ?? "");
    if (!answerText.trim()) {
      return NextResponse.json({ error: "Answer cannot be empty." }, { status: 400 });
    }

    finalAnswerText = answerText;
  }

  // 2) If user RECORDED answer
  if (mode === "record") {
    const audioFile = form.get("audio") as File | null;
    if (!audioFile) {
      return NextResponse.json({ error: "Audio file is required." }, { status: 400 });
    }

    // Convert audio to base64 (Gemini inlineData requires base64)
    const arrayBuffer = await audioFile.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString("base64");

    // Transcribe with Gemini
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { text: "Transcribe the speech verbatim. Return only the transcript text." },
        {
          inlineData: {
            mimeType: audioFile.type || "audio/webm",
            data: base64Audio,
          },
        },
      ],
    });

    finalAnswerText = (result.text ?? "").trim();

    if (!finalAnswerText) {
      return NextResponse.json(
        { error: "Transcription returned empty text. Try again." },
        { status: 500 }
      );
    }
  }

  // 3) Save finalAnswerText
  const timestamp = new Date().toISOString();

  const fileContents =
`sessionId: ${sessionId}
timestamp: ${timestamp}
interviewType: ${interviewType}
questionId: ${questionId}
mode: ${mode}

question:
${question}

answer:
${finalAnswerText}
`;

  const textFilePath = path.join(uploadsDir, `${sessionId}.txt`);
  await fs.writeFile(textFilePath, fileContents, "utf8");

  // Return to frontend
  return NextResponse.json({
    ok: true,
    sessionId,
    savedTextPath: textFilePath,
    transcript: finalAnswerText, // typed or transcribed
  });
}
