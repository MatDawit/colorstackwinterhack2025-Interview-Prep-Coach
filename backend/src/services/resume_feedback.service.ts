import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.MATT_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("MATT_GEMINI_API_KEY environment variable is not set");
}

const genAI = new GoogleGenAI({ apiKey });

export async function generateResumeFeedback(parsedResume: any): Promise<string> {
  const prompt = `You are an expert technical recruiter and career coach reviewing a resume. Provide detailed, actionable feedback on the following parsed resume data.

Resume Data:
${JSON.stringify(parsedResume, null, 2)}

Please provide feedback in the following format:

**Strengths:**
- List 2-3 strong points

**Areas for Improvement:**
- List 3-5 specific improvements with examples

**Action Items:**
- List 3-4 concrete next steps

**Keywords to Add:**
- List 5-8 industry keywords missing from the resume

Focus on:
1. Quantifiable metrics and impact
2. Strong action verbs
3. Technical depth and specificity
4. ATS optimization
5. Overall structure and clarity

Keep feedback constructive, specific, and actionable.`;

  const result = await genAI.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ]
  });

  if (!result.text) {
    throw new Error('Gemini returned an empty response');
  }

  return result.text;
}