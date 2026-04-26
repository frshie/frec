import { StorageProvider } from './index';
import path from 'path';
import fs from 'fs/promises';

const STORAGE_DIR = path.resolve(process.cwd(), 'storage', 'videos');

async function ensureDir(): Promise<void> {
  await fs.mkdir(STORAGE_DIR, { recursive: true });
}

export const localStorage: StorageProvider = {
  async save(filename, data, _mimeType) {
    await ensureDir();
    const filepath = path.join(STORAGE_DIR, filename);
    await fs.writeFile(filepath, data);
    return filepath;
  },

  async get(filepath) {
    try {
      const data = await fs.readFile(filepath);
      return { data, mimeType: 'video/webm' };
    } catch {
      return null;
    }
  },

  async delete(filepath) {
    await fs.unlink(filepath).catch(() => {});
  },
};
