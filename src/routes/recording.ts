import { Router } from 'express';
import { getStorageProvider } from '../storage';
import prisma from '../db';

const router = Router();

// Update title
router.post('/api/recording/:id/title', async (req, res) => {
  try {
    const { title } = req.body;
    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: 'Title is required' });
    }

    const recording = await prisma.recording.update({
      where: { id: req.params.id },
      data: { title: title.slice(0, 200) },
    });

    res.json({ id: recording.id, title: recording.title });
  } catch (err) {
    console.error('Title update error:', err);
    res.status(500).json({ error: 'Failed to update title' });
  }
});

// Delete recording
router.delete('/api/recording/:id', async (req, res) => {
  try {
    const recording = await prisma.recording.findUnique({ where: { id: req.params.id } });
    if (!recording) {
      return res.status(404).json({ error: 'Recording not found' });
    }

    const storage = getStorageProvider();
    await storage.delete(recording.filepath);
    await prisma.recording.delete({ where: { id: req.params.id } });

    res.json({ success: true });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Failed to delete recording' });
  }
});

export default router;
