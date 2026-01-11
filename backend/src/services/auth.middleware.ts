import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = Router();

// Configure multer for resume uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/resumes');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const userId = (req as AuthenticatedRequest).user?.id;
    const ext = path.extname(file.originalname);
    const filename = `${userId}_${Date.now()}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage,
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
router.get('/profile/resume', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

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
router.post('/profile/resume/upload', requireAuth, upload.single('resume'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Delete old resume file if it exists
    const existingResume = await prisma.resume.findUnique({
      where: { userId }
    });

    if (existingResume) {
      const oldFilePath = path.join(__dirname, '../../', existingResume.resumeUrl);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    // Store relative path for serving
    const resumeUrl = `/uploads/resumes/${file.filename}`;

    // Upsert resume in database
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

// DELETE /api/profile/resume - Delete resume
router.delete('/profile/resume', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const resume = await prisma.resume.findUnique({
      where: { userId }
    });

    if (!resume) {
      return res.status(404).json({ error: 'No resume found' });
    }

    // Delete file from filesystem
    const filePath = path.join(__dirname, '../../', resume.resumeUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
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