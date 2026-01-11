import pdfParse from 'pdf-parse';
import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface ParsedResume {
  headline: string;
  summary: string;
  skills: string[];
  roles: Array<{
    company: string;
    title: string;
    location?: string;
    start?: string;
    end?: string;
    bullets: string[];
  }>;
  projects: Array<{
    name: string;
    tech: string[];
    bullets: string[];
    link?: string;
  }>;
  education: Array<{
    school: string;
    degree: string;
    start?: string;
    end?: string;
    gpa?: string;
  }>;
}

export async function parseResumeFromBuffer(buffer: Buffer): Promise<ParsedResume> {
  try {
    // 1. Extract text from PDF
    // @ts-ignore
    const pdfData = await pdfParse(buffer);
    const resumeText = pdfData.text;

    console.log('Extracted text from PDF (first 500 chars):', resumeText.substring(0, 500));

    // 2. Use Gemini to parse the text into structured format
    const prompt = `You are a resume parser. Extract structured information from the following resume text and return it as JSON.

Resume Text:
${resumeText}

Parse the resume and return a JSON object with this exact structure:
{
  "headline": "A brief professional headline (e.g., 'Computer Engineering Student | ML Projects | Full-stack Developer')",
  "summary": "A 2-4 sentence professional summary",
  "skills": ["skill1", "skill2", "skill3", ...],
  "roles": [
    {
      "company": "Company Name",
      "title": "Job Title",
      "location": "City, State",
      "start": "YYYY-MM",
      "end": "YYYY-MM or Present",
      "bullets": ["Achievement 1", "Achievement 2", ...]
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "tech": ["tech1", "tech2", ...],
      "bullets": ["Description 1", "Description 2", ...],
      "link": "URL if available"
    }
  ],
  "education": [
    {
      "school": "University Name",
      "degree": "Degree Name",
      "start": "YYYY",
      "end": "YYYY",
      "gpa": "X.XX if mentioned"
    }
  ]
}

Important:
- Extract ALL skills mentioned (programming languages, frameworks, tools, soft skills)
- For roles and projects, preserve the bullet points as separate array items
- Use "Present" for current positions
- If a field is not found, use empty string or empty array
- Return ONLY valid JSON, no markdown formatting or explanations`;

    const result = await genAI.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt
    });

    const responseText = result.text;
    
    if (!responseText) {
      throw new Error('Gemini returned an empty response');
    }

    console.log('Gemini response received');

    // Clean up the response (remove markdown code blocks if present)
    let jsonText = responseText.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    // Parse JSON
    const parsedData: ParsedResume = JSON.parse(jsonText);

    return parsedData;
  } catch (error) {
    console.error('Error parsing resume:', error);
    throw new Error('Failed to parse resume');
  }
}