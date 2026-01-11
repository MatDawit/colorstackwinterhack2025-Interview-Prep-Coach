import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { requireAuth } from '../services/auth.middleware';
import { prisma } from '../db_connection';
import { supabase } from '../config/supabase';
import { parseResumeFromBuffer } from '../services/resume-parser.service';

const router = Router();

/* -------------------- MULTER CONFIG -------------------- */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) cb(null, true);
    else cb(new Error('Only PDF and Word documents are allowed'));
  }
});

/* -------------------- GET METADATA -------------------- */
router.get('/profile/resume', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.authenticatedUser!.id;

    const resume = await prisma.resume.findUnique({
      where: { userId }
    });

    if (!resume) return res.json({ resume: null });

    res.json({
      resume: {
        resumeUrl: resume.resumeUrl,
        resumeFileName: resume.resumeFileName,
        resumeUpdatedAt: resume.resumeUpdatedAt.toISOString()
      }
    });
  } catch (err) {
    console.error('Error fetching resume:', err);
    res.status(500).json({ error: 'Failed to fetch resume' });
  }
});

/* -------------------- UPLOAD RESUME -------------------- */
router.post(
  '/profile/resume/upload',
  requireAuth,
  upload.single('resume'),
  async (req: Request, res: Response) => {
    try {
      const userId = req.authenticatedUser!.id;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // 🔥 Storage path is ALWAYS: userId/filename
      const fileExt = path.extname(file.originalname);
      const filePath = `${userId}/${Date.now()}${fileExt}`;

      console.log('Uploading resume to Supabase:', filePath);

      // Delete old resume if exists
      const existing = await prisma.resume.findUnique({ where: { userId } });

      if (existing?.storagePath) {
        await supabase.storage.from('resumes').remove([existing.storagePath]);
      }

      // Upload
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: true
        });

      if (uploadError) {
        console.error(uploadError);
        throw uploadError;
      }

      // Public URL
      const { data } = supabase.storage
        .from('resumes')
        .getPublicUrl(filePath);

      // Save metadata
      const resume = await prisma.resume.upsert({
        where: { userId },
        update: {
          resumeUrl: data.publicUrl,
          resumeFileName: file.originalname,
          resumeUpdatedAt: new Date(),
          storagePath: filePath
        },
        create: {
          userId,
          resumeUrl: data.publicUrl,
          resumeFileName: file.originalname,
          storagePath: filePath
        }
      });

      res.json({
        resume: {
          resumeUrl: resume.resumeUrl,
          resumeFileName: resume.resumeFileName,
          resumeUpdatedAt: resume.resumeUpdatedAt.toISOString()
        }
      });
    } catch (err) {
      console.error('Upload error:', err);
      res.status(500).json({ error: 'Failed to upload resume' });
    }
  }
);

/* -------------------- PARSE RESUME -------------------- */
router.get('api/profile/resume', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.authenticatedUser!.id;

    const resume = await prisma.resume.findUnique({ where: { userId } });

    if (!resume || !resume.storagePath) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    console.log('Downloading resume:', resume.storagePath);

    const { data, error } = await supabase.storage
      .from('resumes')
      .download(resume.storagePath);

    if (error || !data) {
      console.error(error);
      return res.status(404).json({ error: 'Failed to download resume' });
    }

    const buffer = Buffer.from(await data.arrayBuffer());

    const parsed = await parseResumeFromBuffer(buffer);

    res.json({ parsed });
  } catch (err) {
    console.error('Parse error:', err);
    res.status(500).json({ error: 'Failed to parse resume' });
  }
});

/* -------------------- DELETE RESUME -------------------- */
router.delete('/profile/resume', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.authenticatedUser!.id;

    const resume = await prisma.resume.findUnique({ where: { userId } });
    if (!resume) return res.status(404).json({ error: 'No resume found' });

    if (resume.storagePath) {
      await supabase.storage.from('resumes').remove([resume.storagePath]);
    }

    await prisma.resume.delete({ where: { userId } });

    res.json({ message: 'Resume deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Failed to delete resume' });
  }
});

export default router;
