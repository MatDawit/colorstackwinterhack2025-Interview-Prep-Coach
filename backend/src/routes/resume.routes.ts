import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { requireAuth } from '../services/auth.middleware';
import { prisma } from '../db_connection';

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/resumes');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const userId = req.authenticatedUser?.id;
    const ext = path.extname(file.originalname);
    const filename = `${userId}_${Date.now()}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
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

router.post('/profile/resume/upload', requireAuth, upload.single('resume'), async (req: Request, res: Response) => {
  try {
    const userId = req.authenticatedUser!.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const existingResume = await prisma.resume.findUnique({
      where: { userId }
    });

    if (existingResume) {
      const oldFilePath = path.join(__dirname, '../../', existingResume.resumeUrl);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    const resumeUrl = `/uploads/resumes/${file.filename}`;

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

router.delete('/profile/resume', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.authenticatedUser!.id;

    const resume = await prisma.resume.findUnique({
      where: { userId }
    });

    if (!resume) {
      return res.status(404).json({ error: 'No resume found' });
    }

    const filePath = path.join(__dirname, '../../', resume.resumeUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

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