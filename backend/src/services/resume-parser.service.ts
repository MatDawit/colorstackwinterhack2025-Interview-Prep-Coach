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

    console.log('📄 Processing PDF with Gemini Vision (handles image-based PDFs)...');

    // 3. Convert PDF to base64 for Gemini Vision
    const base64Pdf = buffer.toString('base64');
    console.log('📊 PDF size:', buffer.length, 'bytes');

    // 4. Use Gemini Vision to read the PDF and extract structured data
    const prompt = `You are a resume parser. Read this resume PDF and extract structured information. Return ONLY valid JSON with this exact structure:

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

    console.log('🚀 Sending PDF to Gemini Vision API...');

    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            { 
              inlineData: { 
                mimeType: 'application/pdf', 
                data: base64Pdf 
              } 
            }
          ]
        }
      ]
    });

    const responseText = result.text;
    
    if (!responseText) {
      throw new Error('Gemini returned an empty response');
    }

    console.log('🤖 Gemini response received');
    console.log('='.repeat(80));
    console.log('📥 RAW GEMINI RESPONSE:');
    console.log(responseText);
    console.log('='.repeat(80));

    // 5. Clean up the response (remove markdown code blocks if present)
    let jsonText = responseText.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      console.log('🧹 Removed ```json markdown');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
      console.log('🧹 Removed ``` markdown');
    }

    console.log('='.repeat(80));
    console.log('🧼 CLEANED JSON:');
    console.log(jsonText);
    console.log('='.repeat(80));

    // 6. Parse JSON
    const parsedData: ParsedResume = JSON.parse(jsonText);

    console.log('✅ JSON parsed successfully');
    console.log('📋 Summary:');
    console.log('   Headline:', parsedData.headline);
    console.log('   Skills:', parsedData.skills.length);
    console.log('   Roles:', parsedData.roles.length);
    console.log('   Projects:', parsedData.projects.length);
    console.log('   Education:', parsedData.education.length);

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