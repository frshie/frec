<p align="center">
  <img src="https://img.shields.io/badge/status-active-6ba58a?style=flat-square" alt="Status">
  <img src="https://img.shields.io/badge/node-%3E%3D18-6ba58a?style=flat-square" alt="Node">
  <img src="https://img.shields.io/badge/license-MIT-6ba58a?style=flat-square" alt="License">
  <img src="https://img.shields.io/badge/built%20with-Claude%20Code-6ba58a?style=flat-square" alt="Built with Claude Code">
</p>

<h1 align="center">FREC</h1>
<p align="center"><strong>Browser-based screen recording, self-hosted.</strong></p>

<p align="center">
  Record your screen, tab, or camera — or any combination — directly in the browser.<br>
  Upload, share, and play back with a unique link. No accounts, no cloud dependency.
</p>

<p align="center">
  <i>Built collaboratively with Claude Code (Deepseek V4, Gemini, and Claude).</i>
</p>

---

## Features

- **5 recording modes** — Screen only, Tab only, Camera only, Screen + Camera (PiP), Tab + Camera (PiP)
- **Canvas compositing** — Camera is baked into the video as picture-in-picture, not a local overlay
- **Pause & Resume** — Pause mid-recording and pick up where you left off
- **Live preview** — See your capture before you hit record
- **Upload with progress** — Real-time progress bar during upload
- **Shareable links** — Each recording gets a unique `/rec/:id` URL
- **Video player** — Public page with playback, metadata, and one-click copy
- **Pluggable storage** — Local filesystem by default, Cloudflare R2 with one env var
- **Custom domains** — Map domains to recordings via the API
- **Refined minimal UI** — Clean, warm-dark interface with Outfit typography

## Quick Start

```bash
# One-command setup (installs deps + creates your own database)
npm run setup

# Start development server
npm run dev
```

Open **http://localhost:3000** — select a recording mode and go.

### Production

```bash
npm run build
npm start
```

### Production with PostgreSQL

```bash
# Set DATABASE_URL in .env, then:
npm run db:setup
```

## How It Works

```
Browser (MediaRecorder) ──► XHR Upload ──► Express API ──► StorageProvider
                                                              ├── Local (default)
                                                              └── R2 (S3-compatible)
```

1. **Capture** — The browser uses `getDisplayMedia()` for screen/tab and `getUserMedia()` for camera. For PiP modes, a Canvas composites both streams at ~30fps into the final recording.

2. **Upload** — When you stop recording, the WebM blob uploads via XHR to `POST /api/upload` with title and duration. A progress bar shows real-time status.

3. **Store** — The upload route saves through a `StorageProvider` interface. Default is local disk; switching to Cloudflare R2 is one environment variable.

4. **Share** — Each recording gets a nanoid-based unique ID. The public URL follows `BASE_URL/rec/:id`. Anyone with the link can watch.

5. **Custom domains** — The API lets you map a domain to a recording. The `Host` header is checked against the `RecordingDomain` table on the player route.

## Architecture

```
frec/
├── src/
│   ├── index.ts               Express app — routes, views, entry point
│   ├── db.ts                  Prisma client singleton
│   ├── utils.ts               ID generation, formatting helpers
│   ├── routes/
│   │   ├── upload.ts          POST /api/upload — receive recordings
│   │   ├── video.ts           GET /api/video/:id — serve video + metadata
│   │   ├── recording.ts       POST/DELETE recording management
│   │   └── domain.ts          Custom domain mapping API
│   └── storage/
│       ├── index.ts           StorageProvider interface
│       ├── local.ts           Filesystem storage
│       └── r2.ts              Cloudflare R2 storage (S3-compatible)
├── views/
│   ├── recorder.ejs           Recording interface
│   └── player.ejs             Public video player
├── public/
│   ├── css/
│   │   ├── recorder.css
│   │   └── player.css
│   └── js/
│       └── recorder.js        Client-side recording + upload logic
├── prisma/
│   └── schema.prisma          SQLite schema (Recording, RecordingDomain)
└── storage/videos/            Local video storage directory
```

## Configuration

All via environment variables (see `.env.example`):

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Server port |
| `HOST` | `0.0.0.0` | Bind address |
| `BASE_URL` | `http://localhost:3000` | Public URL for share links |
| `DATABASE_URL` | `file:./prisma/dev.db` | SQLite or PostgreSQL connection |
| `STORAGE_TYPE` | `local` | `local` or `r2` |

### R2 Storage

```env
STORAGE_TYPE=r2
R2_ENDPOINT=https://<account>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=<your-access-key>
R2_SECRET_ACCESS_KEY=<your-secret-key>
R2_BUCKET=frec-recordings
```

## API

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/` | Recorder UI |
| `POST` | `/api/upload` | Upload a recording (multipart, field: `video`) |
| `GET` | `/rec/:id` | Public player page |
| `GET` | `/api/video/:id` | Stream video file |
| `GET` | `/api/video/:id/metadata` | Video metadata |
| `POST` | `/api/recording/:id/title` | Update title |
| `DELETE` | `/api/recording/:id` | Delete recording |
| `POST` | `/api/recording/:id/domain` | Link custom domain |
| `DELETE` | `/api/recording/:id/domain/:domainId` | Unlink domain |

## Recording Modes

| Mode | Source | Camera PiP |
|---|---|---|
| Screen | `getDisplayMedia()` | — |
| Tab | `getDisplayMedia({ preferCurrentTab })` | — |
| Camera | `getUserMedia()` | Full frame |
| Screen + Camera | Canvas composite | Bottom-right overlay |
| Tab + Camera | Canvas composite | Bottom-right overlay |

In PiP modes, the camera is composited into a rounded-rectangle overlay in the bottom-right corner of the output video — baked into the file, not a local overlay.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express, TypeScript |
| Database | SQLite / PostgreSQL via Prisma ORM |
| Frontend | Vanilla JS, EJS templates, Outfit |
| Recording | `MediaRecorder` API, Canvas compositing |
| Storage | Local filesystem / Cloudflare R2 (`@aws-sdk/client-s3`) |
| IDs | nanoid (12-character unique IDs) |

## Built With AI

FREC was developed using **Claude Code** with a multi-model workflow:

- **Deepseek V4 Flash** — primary coding model
- **Claude Opus 4.6** — architectural decisions, design refinement
- **Gemini** — complementary implementation passes

The entire frontend was redesigned from neon-noir maximalist to a clean, Claude-inspired minimal aesthetic through an iterative AI collaboration.

---

<p align="center">
  <sub>Built by FReSh with Claude Code.</sub>
</p>
