import express from 'express';
import path from 'path';
import uploadRouter from './routes/upload';
import videoRouter from './routes/video';
import recordingRouter from './routes/recording';
import domainRouter, { resolveRecordingByDomain } from './routes/domain';
import prisma from './db';
import { formatFileSize, formatDuration } from './utils';

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.resolve(process.cwd(), 'public')));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.resolve(process.cwd(), 'views'));

// Routes
app.use(uploadRouter);
app.use(videoRouter);
app.use(recordingRouter);
app.use(domainRouter);

// Home page — recorder
app.get('/', (_req, res) => {
  res.render('recorder', { baseUrl: BASE_URL });
});

// Player page — public video view
app.get('/rec/:id', async (req, res) => {
  try {
    const recording = await prisma.recording.findUnique({
      where: { id: req.params.id },
    });

    if (!recording) {
      // Try custom domain resolution
      const host = req.get('host');
      if (host) {
        const domainRecordingId = await resolveRecordingByDomain(host);
        if (domainRecordingId) {
          const domainRecording = await prisma.recording.findUnique({
            where: { id: domainRecordingId },
          });
          if (domainRecording) {
            return res.render('player', {
              recording: domainRecording,
              title: domainRecording.title || 'Untitled',
              url: `${BASE_URL}/rec/${domainRecording.id}`,
              formatFileSize,
              formatDuration,
            });
          }
        }
      }

      return res.status(404).render('player', {
        recording: null,
        title: 'Not Found',
        url: `${BASE_URL}/rec/${req.params.id}`,
        formatFileSize,
        formatDuration,
      });
    }

    res.render('player', {
      recording,
      title: recording.title || 'Untitled',
      url: `${BASE_URL}/rec/${recording.id}`,
      formatFileSize,
      formatDuration,
    });
  } catch (err) {
    console.error('Player error:', err);
    res.status(500).send('Server error');
  }
});

app.listen(PORT, () => {
  console.log(`frec running at ${BASE_URL}`);
});

export default app;
