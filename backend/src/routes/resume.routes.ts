import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { requireAuth } from '../services/auth.middleware';
import { prisma } from '../db_connection';
import { supabase } from '../config/supabase';
import { parseResumeFromBuffer } from '../services/resume-parser.service';

const router = Router();

// Configure multer to store in memory (not filesystem)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and Word documents are allowed'));
    }
  }
});

// GET /api/profile/resume - Get user's resume metadata
router.get('/profile/resume', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.authenticatedUser!.id;

    const resume = await prisma.resume.findUnique({
      where: { userId }
    });

    if (!resume) {
      return res.json({ resume: null });
    }

    res.json({
      resume: {
        resumeUrl: resume.resumeUrl,
        resumeFileName: resume.resumeFileName,
        resumeUpdatedAt: resume.resumeUpdatedAt.toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching resume:', error);
    res.status(500).json({ error: 'Failed to fetch resume' });
  }
});

// POST /api/profile/resume/upload - Upload or update resume
router.post('/profile/resume/upload', requireAuth, upload.single('resume'), async (req: Request, res: Response) => {
  try {
    const userId = req.authenticatedUser!.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('Uploading resume for user:', userId);

    // Delete old resume from Supabase if exists
    const existingResume = await prisma.resume.findUnique({
      where: { userId }
    });

    if (existingResume) {
      // Extract old file path from URL and delete from storage
      const urlParts = existingResume.resumeUrl.split('/resumes/');
      const oldPath = urlParts.length > 1 ? urlParts[1] : null;
      if (oldPath) {
        console.log('Deleting old resume:', oldPath);
        await supabase.storage.from('resumes').remove([oldPath]);
      }
    }

    // Upload to Supabase Storage
    const fileExt = path.extname(file.originalname);
    const filePath = `${userId}/${Date.now()}${fileExt}`;
    
    console.log('Uploading to Supabase path:', filePath);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('resumes')
      .getPublicUrl(filePath);

    const resumeUrl = urlData.publicUrl;
    
    console.log('Resume uploaded successfully:', resumeUrl);

    // Save to database
    const resume = await prisma.resume.upsert({
      where: { userId },
      update: {
        resumeUrl,
        resumeFileName: file.originalname,
        resumeUpdatedAt: new Date()
      },
      create: {
        userId,
        resumeUrl,
        resumeFileName: file.originalname
      }
    });

    res.json({
      resume: {
        resumeUrl: resume.resumeUrl,
        resumeFileName: resume.resumeFileName,
        resumeUpdatedAt: resume.resumeUpdatedAt.toISOString()
      }
    });
  } catch (error) {
    console.error('Error uploading resume:', error);
    res.status(500).json({ error: 'Failed to upload resume' });
  }
});

// GET /api/profile/resume/parse - Parse the user's resume
router.get('/profile/resume/parse', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.authenticatedUser!.id;

    console.log('Parsing resume for user:', userId);

    // Get resume metadata from database
    const resume = await prisma.resume.findUnique({
      where: { userId }
    });

    if (!resume) {
      return res.status(404).json({ error: 'No resume found. Please upload a resume first.' });
    }

    console.log('Fetching resume from Supabase:', resume.resumeUrl);

    // Extract file path from URL
    const urlParts = resume.resumeUrl.split('/resumes/');
    const filePath = urlParts.length > 1 ? urlParts[1] : null;
    
    if (!filePath) {
      return res.status(404).json({ error: 'Invalid resume URL' });
    }

    // Download file from Supabase
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('resumes')
      .download(filePath);

    if (downloadError || !fileData) {
      console.error('Error downloading from Supabase:', downloadError);
      return res.status(404).json({ error: 'Resume file not found' });
    }

    // Convert Blob to Buffer
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log('Downloaded resume, size:', buffer.length, 'bytes');

    // Parse the PDF from buffer
    const parsed = await parseResumeFromBuffer(buffer);

    console.log('Resume parsed successfully for user:', userId);

    res.json({ parsed });
  } catch (error) {
    console.error('Error parsing resume:', error);
    res.status(500).json({ error: 'Failed to parse resume' });
  }
});

// DELETE /api/profile/resume - Delete resume
router.delete('/profile/resume', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.authenticatedUser!.id;

    const resume = await prisma.resume.findUnique({
      where: { userId }
    });

    if (!resume) {
      return res.status(404).json({ error: 'No resume found' });
    }

    // Delete from Supabase Storage
    const urlParts = resume.resumeUrl.split('/resumes/');
    const filePath = urlParts.length > 1 ? urlParts[1] : null;
    if (filePath) {
      await supabase.storage.from('resumes').remove([filePath]);
    }

    // Delete from database
    await prisma.resume.delete({
      where: { userId }
    });

    res.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    console.error('Error deleting resume:', error);
    res.status(500).json({ error: 'Failed to delete resume' });
  }
});

export default router;