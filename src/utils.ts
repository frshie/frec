import { nanoid } from 'nanoid';

export function generateId(): string {
  return nanoid(12);
}

export function getFileExtension(mimeType: string): string {
  const map: Record<string, string> = {
    'video/webm': '.webm',
    'video/mp4': '.mp4',
    'video/ogg': '.ogv',
    'video/x-matroska': '.mkv',
  };
  return map[mimeType] || '.webm';
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
