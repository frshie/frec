import { Router } from 'express';
import prisma from '../db';

const router = Router();

// Link a domain to a recording
router.post('/api/recording/:id/domain', async (req, res) => {
  try {
    const { domain } = req.body;
    if (!domain || typeof domain !== 'string') {
      return res.status(400).json({ error: 'Domain is required' });
    }

    const recording = await prisma.recording.findUnique({ where: { id: req.params.id } });
    if (!recording) {
      return res.status(404).json({ error: 'Recording not found' });
    }

    const cleanDomain = domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');

    const mapping = await prisma.recordingDomain.create({
      data: {
        recordingId: recording.id,
        domain: cleanDomain,
      },
    });

    res.json({ id: mapping.id, domain: cleanDomain, recordingId: recording.id });
  } catch (err) {
    console.error('Domain link error:', err);
    res.status(500).json({ error: 'Failed to link domain' });
  }
});

// Unlink a domain
router.delete('/api/recording/:id/domain/:domainId', async (req, res) => {
  try {
    await prisma.recordingDomain.delete({
      where: { id: req.params.domainId, recordingId: req.params.id },
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Domain unlink error:', err);
    res.status(500).json({ error: 'Failed to unlink domain' });
  }
});

// Custom domain lookup — integrate into the /rec/:id route
export async function resolveRecordingByDomain(host: string): Promise<string | null> {
  try {
    const cleanHost = host.split(':')[0];
    const mapping = await prisma.recordingDomain.findFirst({
      where: { domain: cleanHost },
      include: { recording: true },
    });
    return mapping?.recordingId || null;
  } catch {
    return null;
  }
}

export default router;
