import { Router } from 'express';
import { getStorageProvider } from '../storage';
import prisma from '../db';

const router = Router();

// Video metadata
router.get('/api/video/:id/metadata', async (req, res) => {
  try {
    const recording = await prisma.recording.findUnique({ where: { id: req.params.id } });
    if (!recording) {
      return res.status(404).json({ error: 'Recording not found' });
    }
    res.json({
      id: recording.id,
      title: recording.title,
      filesize: recording.filesize,
      duration: recording.duration,
      mimeType: recording.mimeType,
      createdAt: recording.createdAt,
    });
  } catch (err) {
    console.error('Metadata error:', err);
    res.status(500).json({ error: 'Failed to fetch metadata' });
  }
});

// Video file stream
router.get('/api/video/:id', async (req, res) => {
  try {
    const recording = await prisma.recording.findUnique({ where: { id: req.params.id } });
    if (!recording) {
      return res.status(404).json({ error: 'Recording not found' });
    }

    const storage = getStorageProvider();
    const result = await storage.get(recording.filepath);
    if (!result) {
      return res.status(404).json({ error: 'Video file not found' });
    }

    res.set('Content-Type', recording.mimeType);
    res.set('Content-Length', result.data.length.toString());
    res.set('Accept-Ranges', 'bytes');
    res.send(result.data);
  } catch (err) {
    console.error('Video serve error:', err);
    res.status(500).json({ error: 'Failed to serve video' });
  }
});

export default router;
