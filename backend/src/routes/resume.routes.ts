import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import { requireAuth } from "../services/auth.middleware";
import { prisma } from "../db_connection";
import { supabase } from "../config/supabase";
import { parseResumeFromBuffer } from "../services/resume-parser.service";

const router = Router();

// Configure multer to store in memory (not filesystem)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [".pdf", ".doc", ".docx"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and Word documents are allowed"));
    }
  },
});

/**
 * GET /
 * @summary Fetch the authenticated user's resume metadata
 * @description
 * Returns information about the user's uploaded resume (URL, filename, last updated), or null if none exists.
 */
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.authenticatedUser!.id;

    const resume = await prisma.resume.findUnique({
      where: { userId },
    });

    if (!resume) {
      res.json({ resume: null });
      return;
    }

    res.json({
      resume: {
        resumeUrl: resume.resumeUrl,
        resumeFileName: resume.resumeFileName,
        resumeUpdatedAt: resume.resumeUpdatedAt.toISOString(),
      },
    });
    return;
  } catch (error) {
    console.error("Error fetching resume:", error);
    res.status(500).json({ error: "Failed to fetch resume" });
    return;
  }
});

/**
 * POST /upload
 * @summary Upload or update a resume
 * @description
 * Accepts a PDF or Word document, replaces any existing resume in Supabase,
 * and stores metadata in the database.
 */
router.post(
  "/upload",
  requireAuth,
  upload.single("resume"),
  async (req: Request, res: Response) => {
    try {
      const userId = req.authenticatedUser!.id;
      const file = req.file;

      if (!file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
      }

      console.log("Uploading resume for user:", userId);

      // Delete old resume from Supabase if exists
      const existingResume = await prisma.resume.findUnique({
        where: { userId },
      });

      if (existingResume) {
        // Extract old file path from URL and delete from storage
        const urlParts = existingResume.resumeUrl.split("/resumes/");
        const oldPath = urlParts.length > 1 ? urlParts[1] : null;
        if (oldPath) {
          console.log("Deleting old resume:", oldPath);
          await supabase.storage.from("resumes").remove([oldPath]);
        }
      }

      // Upload to Supabase Storage
      const fileExt = path.extname(file.originalname);
      const filePath = `${userId}/${Date.now()}${fileExt}`;

      console.log("Uploading to Supabase path:", filePath);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (uploadError) {
        console.error("Supabase upload error:", uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("resumes")
        .getPublicUrl(filePath);

      const resumeUrl = urlData.publicUrl;

      console.log("Resume uploaded successfully:", resumeUrl);

      // Save to database
      const resume = await prisma.resume.upsert({
        where: { userId },
        update: {
          resumeUrl,
          resumeFileName: file.originalname,
          resumeUpdatedAt: new Date(),
        },
        create: {
          userId,
          resumeUrl,
          resumeFileName: file.originalname,
        },
      });

      res.json({
        resume: {
          resumeUrl: resume.resumeUrl,
          resumeFileName: resume.resumeFileName,
          resumeUpdatedAt: resume.resumeUpdatedAt.toISOString(),
        },
      });
      return;
    } catch (error) {
      console.error("Error uploading resume:", error);
      res.status(500).json({ error: "Failed to upload resume" });
      return;
    }
  }
);

/**
 * GET /parse
 * @summary Parse the user's uploaded resume
 * @description
 * Downloads the resume from Supabase storage and parses it into structured data using the resume parser service.
 */
router.get("/parse", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.authenticatedUser!.id;

    console.log("Parsing resume for user:", userId);

    // Get resume metadata from database
    const resume = await prisma.resume.findUnique({
      where: { userId },
    });

    if (!resume) {
      return res
        .status(404)
        .json({ error: "No resume found. Please upload a resume first." });
    }

    console.log("Fetching resume from Supabase:", resume.resumeUrl);

    // Extract file path from URL
    const urlParts = resume.resumeUrl.split("/resumes/");
    const filePath = urlParts.length > 1 ? urlParts[1] : null;

    if (!filePath) {
      return res.status(404).json({ error: "Invalid resume URL" });
    }

    // Download file from Supabase
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("resumes")
      .download(filePath);

    if (downloadError || !fileData) {
      console.error("Error downloading from Supabase:", downloadError);
      return res.status(404).json({ error: "Resume file not found" });
    }

    // Convert Blob to Buffer
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log("Downloaded resume, size:", buffer.length, "bytes");

    // Parse the PDF from buffer
    const parsed = await parseResumeFromBuffer(buffer);

    console.log("Resume parsed successfully for user:", userId);

    res.json({ parsed });
    return;
  } catch (error) {
    console.error("Error parsing resume:", error);
    res.status(500).json({ error: "Failed to parse resume" });
    return;
  }
});

/**
 * DELETE /
 * @summary Delete the user's uploaded resume
 * @description
 * Removes the resume file from Supabase storage and deletes the corresponding database record.
 */
router.delete("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.authenticatedUser!.id;

    const resume = await prisma.resume.findUnique({
      where: { userId },
    });

    if (!resume) {
      res.status(404).json({ error: "No resume found" });
      return;
    }

    // Delete from Supabase Storage
    const urlParts = resume.resumeUrl.split("/resumes/");
    const filePath = urlParts.length > 1 ? urlParts[1] : null;
    if (filePath) {
      await supabase.storage.from("resumes").remove([filePath]);
    }

    // Delete from database
    await prisma.resume.delete({
      where: { userId },
    });

    res.json({ message: "Resume deleted successfully" });
    return;
  } catch (error) {
    console.error("Error deleting resume:", error);
    res.status(500).json({ error: "Failed to delete resume" });
    return;
  }
});

export default router;
