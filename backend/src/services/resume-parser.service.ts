import PDFParser from 'pdf2json';
import { GoogleGenAI } from '@google/genai';
import crypto from 'crypto';

const genAI = new GoogleGenAI({ apiKey: process.env.FAD_GEMINI_API_KEY || '' });

// In-memory cache (in production, use Redis or database)
const resumeCache = new Map<string, ParsedResume>();

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
    // 1. Create hash of PDF content for caching
    const hash = crypto.createHash('md5').update(buffer).digest('hex');
    
    // 2. Check cache first (avoid unnecessary API calls)
    if (resumeCache.has(hash)) {
      console.log('✅ Using cached resume data - no API call needed');
      return resumeCache.get(hash)!;
    }

    // 3. Extract text from PDF
    const pdfParser = new PDFParser();
    
    const pdfText = await new Promise<string>((resolve, reject) => {
      pdfParser.on('pdfParser_dataError', (errData: any) => reject(errData.parserError));
      pdfParser.on('pdfParser_dataReady', () => {
        const text = (pdfParser as any).getRawTextContent();
        resolve(text);
      });
      pdfParser.parseBuffer(buffer);
    });

    console.log('📄 Extracted text from PDF (first 500 chars):', pdfText.substring(0, 500));

    // 4. Use Gemini AI to parse the text into structured format
    const prompt = `You are a resume parser. Extract structured information from the following resume text and return it as JSON.

Resume Text:
${pdfText}

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

    // Use gemini-2.5-flash-lite (same as your working feedback routes)
    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ]
    });

    const responseText = result.text;
    
    if (!responseText) {
      throw new Error('Gemini returned an empty response');
    }

    console.log('🤖 Gemini response received');

    // 5. Clean up the response (remove markdown code blocks if present)
    let jsonText = responseText.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    // 6. Parse JSON
    const parsedData: ParsedResume = JSON.parse(jsonText);

    // 7. Cache the result for 1 hour (avoids re-parsing same resume)
    resumeCache.set(hash, parsedData);
    setTimeout(() => {
      resumeCache.delete(hash);
      console.log('🗑️  Cache expired for resume:', hash);
    }, 3600000); // 1 hour

    console.log('✅ Resume parsed and cached successfully');
    return parsedData;

  } catch (error) {
    console.error('❌ Error parsing resume:', error);
    throw new Error('Failed to parse resume');
  }
}