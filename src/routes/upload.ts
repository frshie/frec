import { Router } from 'express';
import multer from 'multer';
import { getStorageProvider } from '../storage';
import { generateId, getFileExtension } from '../utils';
import prisma from '../db';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 1024 * 1024 * 1024 } }); // 1GB

router.post('/api/upload', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    const id = generateId();
    const ext = getFileExtension(req.file.mimetype);
    const filename = `${id}${ext}`;
    const storage = getStorageProvider();
    const filepath = await storage.save(filename, req.file.buffer, req.file.mimetype);

    const recording = await prisma.recording.create({
      data: {
        id,
        title: (req.body.title as string) || null,
        filename,
        filepath,
        filesize: req.file.size,
        duration: req.body.duration ? parseFloat(req.body.duration) : null,
        mimeType: req.file.mimetype,
        storageType: process.env.STORAGE_TYPE || 'local',
      },
    });

    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;

    res.json({
      id: recording.id,
      url: `${baseUrl}/rec/${recording.id}`,
      title: recording.title,
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

export default router;
