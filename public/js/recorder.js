// ── FREC Recorder ──
let mediaRecorder = null;
let recordedChunks = [];
let screenStream = null;
let cameraStream = null;
let compositedStream = null;
let recordingTimer = null;
let startTime = null;
let currentMode = null;

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const els = {
  videoPreview: $('#video-preview'),
  cameraOverlay: $('#camera-overlay'),
  cameraVideo: $('#camera-video'),
  startBtn: $('#start-btn'),
  stopBtn: $('#stop-btn'),
  pauseBtn: $('#pause-btn'),
  pauseLabel: $('#pause-label'),
  navStatus: $('#nav-status'),
  statusLabel: $('#status-label'),
  statusDot: $('#status-dot'),
  recLive: $('#rec-live'),
  recLiveTime: $('#rec-live-time'),
  timer: $('#timer'),
  timerContainer: $('#timer'),
  recorderCard: $('#recorder-card'),
  uploadSection: $('#upload-section'),
  titleInput: $('#title-input'),
  uploadBtn: $('#upload-btn'),
  progressBar: $('#progress-bar'),
  progressFill: $('#progress-fill'),
  progressPct: $('#progress-pct'),
  resultSection: $('#result-section'),
  resultLink: $('#result-link'),
  modeBtns: $$('.mode-btn'),
  previewPlaceholder: $('#preview-placeholder'),
};

function stopAllTracks(stream) {
  if (!stream) return;
  stream.getTracks().forEach((t) => t.stop());
}

function getCompositedStream(screen, camera) {
  if (!camera) return;

  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d');

  const screenTrack = screen.getVideoTracks()[0];
  const settings = screenTrack.getSettings();
  canvas.width = settings.width || 1280;
  canvas.height = settings.height || 720;

  const composer = setInterval(() => {
    ctx.drawImage(els.videoPreview, 0, 0, canvas.width, canvas.height);

    const pipW = Math.floor(canvas.width * 0.25);
    const pipH = Math.floor(pipW * (9 / 16));
    const pipX = canvas.width - pipW - 16;
    const pipY = canvas.height - pipH - 16;

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(pipX - 2, pipY - 2, pipW + 4, pipH + 4);

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(pipX, pipY, pipW, pipH, 8);
    ctx.clip();
    ctx.drawImage(els.cameraVideo, pipX, pipY, pipW, pipH);
    ctx.restore();
  }, 33);

  const composite = canvas.captureStream(30);

  if (screen.getAudioTracks().length > 0) {
    screen.getAudioTracks().forEach((t) => composite.addTrack(t));
  }

  return { stream: composite, composer };
}

els.modeBtns.forEach((btn) => {
  btn.addEventListener('click', async () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') return;

    els.modeBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    currentMode = btn.dataset.mode;

    stopAllTracks(screenStream);
    stopAllTracks(cameraStream);
    if (compositedStream) {
      clearInterval(compositedStream.composer);
      compositedStream = null;
    }
    els.videoPreview.srcObject = null;
    screenStream = null;
    cameraStream = null;
    els.previewPlaceholder.style.display = 'flex';
    els.videoPreview.style.display = 'none';
    els.cameraOverlay.style.display = 'none';

    if (currentMode === 'screen' || currentMode === 'screen-camera') {
      try {
        screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
      } catch {
        btn.classList.remove('active');
        currentMode = null;
        return;
      }
    }

    if (currentMode === 'tab' || currentMode === 'tab-camera') {
      try {
        screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
          preferCurrentTab: true,
        });
      } catch {
        btn.classList.remove('active');
        currentMode = null;
        return;
      }
    }

    if (
      currentMode === 'camera' ||
      currentMode === 'screen-camera' ||
      currentMode === 'tab-camera'
    ) {
      try {
        cameraStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        els.cameraVideo.srcObject = cameraStream;
        els.cameraOverlay.style.display = 'block';
      } catch {
        if (currentMode === 'camera') {
          btn.classList.remove('active');
          currentMode = null;
          return;
        }
        cameraStream = null;
      }
    }

    if (currentMode === 'camera') {
      els.videoPreview.srcObject = cameraStream;
      els.previewPlaceholder.style.display = 'none';
      els.videoPreview.style.display = 'block';
      els.cameraOverlay.style.display = 'none';
      els.startBtn.disabled = false;
      return;
    }

    if (screenStream) {
      els.videoPreview.srcObject = screenStream;
      els.previewPlaceholder.style.display = 'none';
      els.videoPreview.style.display = 'block';
      els.startBtn.disabled = false;
    }
  });
});

els.startBtn.addEventListener('click', startRecording);
els.stopBtn.addEventListener('click', stopRecording);
els.pauseBtn.addEventListener('click', togglePause);
els.uploadBtn.addEventListener('click', uploadRecording);

async function startRecording() {
  recordedChunks = [];

  let streamToRecord;

  if (currentMode === 'screen-camera' || currentMode === 'tab-camera') {
    if (cameraStream) {
      const result = getCompositedStream(screenStream, cameraStream);
      compositedStream = result;
      streamToRecord = result.stream;
    } else {
      streamToRecord = screenStream;
    }
  } else if (currentMode === 'camera') {
    streamToRecord = cameraStream;
  } else {
    streamToRecord = screenStream;
  }

  if (!streamToRecord) return;

  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
    ? 'video/webm;codecs=vp9,opus'
    : 'video/webm';

  mediaRecorder = new MediaRecorder(streamToRecord, { mimeType });

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) recordedChunks.push(e.data);
  };

  mediaRecorder.onstop = onRecordingStop;

  mediaRecorder.start(100);

  // ── UI: Recording State ──
  els.startBtn.disabled = true;
  els.stopBtn.disabled = false;
  els.pauseBtn.disabled = false;
  els.modeBtns.forEach((b) => (b.disabled = true));

  els.recorderCard.classList.add('recording-active');
  els.timerContainer.classList.add('recording');
  els.recLive.classList.add('visible');
  els.navStatus.classList.add('recording');
  els.statusLabel.textContent = 'Recording';

  startTime = Date.now();
  recordingTimer = setInterval(updateTimer, 100);
}

let elapsed = 0;

function updateTimer() {
  elapsed = Date.now() - startTime;
  const totalSec = Math.floor(elapsed / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  const formatted = `${m}:${s.toString().padStart(2, '0')}`;
  els.timer.textContent = formatted;
  els.recLiveTime.textContent = formatted;
}

function togglePause() {
  if (mediaRecorder.state === 'recording') {
    mediaRecorder.pause();
    els.pauseLabel.textContent = 'Resume';
    clearInterval(recordingTimer);
  } else if (mediaRecorder.state === 'paused') {
    mediaRecorder.resume();
    els.pauseLabel.textContent = 'Pause';
    startTime = Date.now() - elapsed;
    recordingTimer = setInterval(updateTimer, 100);
  }
}

async function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }

  clearInterval(recordingTimer);

  if (compositedStream) {
    clearInterval(compositedStream.composer);
    compositedStream.stream.getTracks().forEach((t) => t.stop());
    compositedStream = null;
  }
}

function onRecordingStop() {
  // ── UI: Stopped State ──
  els.stopBtn.disabled = true;
  els.pauseBtn.disabled = true;
  els.pauseLabel.textContent = 'Pause';

  els.recorderCard.classList.remove('recording-active');
  els.timerContainer.classList.remove('recording');
  els.recLive.classList.remove('visible');
  els.navStatus.classList.remove('recording');
  els.statusLabel.textContent = 'Ready';

  els.uploadSection.classList.add('visible');
  els.uploadSection.style.display = 'block';
  els.uploadBtn.disabled = false;

  if (currentMode !== 'camera' && screenStream) {
    screenStream.getTracks().forEach((t) => t.stop());
  }
  if (cameraStream) {
    cameraStream.getTracks().forEach((t) => t.stop());
    els.cameraOverlay.style.display = 'none';
  }
}

async function uploadRecording() {
  const blob = new Blob(recordedChunks, { type: mediaRecorder.mimeType });
  const title = els.titleInput.value.trim() || 'Untitled Recording';

  const formData = new FormData();
  formData.append('video', blob, 'recording.webm');
  formData.append('title', title);
  formData.append('duration', (elapsed / 1000).toString());

  els.uploadBtn.disabled = true;
  els.uploadBtn.querySelector('span').textContent = 'Uploading...';
  els.progressBar.classList.add('visible');
  els.progressBar.style.display = 'flex';

  const xhr = new XMLHttpRequest();

  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable) {
      const pct = (e.loaded / e.total) * 100;
      els.progressFill.style.width = pct + '%';
      els.progressPct.textContent = Math.round(pct) + '%';
    }
  };

  xhr.onload = () => {
    if (xhr.status === 200) {
      const data = JSON.parse(xhr.responseText);
      els.resultLink.href = data.url;
      els.resultLink.textContent = data.url;
      els.resultSection.classList.add('visible');
      els.resultSection.style.display = 'block';
      els.uploadBtn.querySelector('span').textContent = 'Uploaded';
      els.progressFill.style.width = '100%';
      els.progressPct.textContent = '100%';
      els.statusLabel.textContent = 'Shared';
    } else {
      els.uploadBtn.querySelector('span').textContent = 'Upload Failed';
      els.uploadBtn.disabled = false;
    }
  };

  xhr.onerror = () => {
    els.uploadBtn.querySelector('span').textContent = 'Upload Failed';
    els.uploadBtn.disabled = false;
  };

  xhr.open('POST', '/api/upload', true);
  xhr.send(formData);
}

// ── Copy Result Link ──
window.copyResultLink = function () {
  const url = els.resultLink.href;
  navigator.clipboard.writeText(url).then(() => {
    const btn = document.querySelector('.ctrl-copy');
    btn.classList.add('copied');
    btn.querySelector('span').textContent = 'Copied!';
    setTimeout(() => {
      btn.classList.remove('copied');
      btn.querySelector('span').textContent = 'Copy';
    }, 2000);
  });
};

// ── Record Another ──
$('#record-new-btn')?.addEventListener('click', () => {
  location.reload();
});

// ── Keyboard Shortcuts ──
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault();
    if (!els.startBtn.disabled) startRecording();
    else if (!els.stopBtn.disabled) stopRecording();
  }
});
