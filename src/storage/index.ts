import { localStorage } from './local';
import { r2Storage } from './r2';

export interface StorageProvider {
  save(filename: string, data: Buffer, mimeType: string): Promise<string>;
  get(filepath: string): Promise<{ data: Buffer; mimeType: string } | null>;
  delete(filepath: string): Promise<void>;
}

export function getStorageProvider(): StorageProvider {
  const type = process.env.STORAGE_TYPE || 'local';
  if (type === 'r2') {
    return r2Storage;
  }
  return localStorage;
}
