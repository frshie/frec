import { StorageProvider } from './index';
import { S3Client, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET || 'frec-recordings';

export const r2Storage: StorageProvider = {
  async save(filename, data, mimeType) {
    const upload = new Upload({
      client: r2Client,
      params: {
        Bucket: BUCKET,
        Key: filename,
        Body: data,
        ContentType: mimeType,
      },
    });
    await upload.done();
    return filename;
  },

  async get(key) {
    try {
      const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key });
      const resp = await r2Client.send(cmd);
      const data = await resp.Body!.transformToByteArray();
      return { data: Buffer.from(data), mimeType: resp.ContentType || 'video/webm' };
    } catch {
      return null;
    }
  },

  async delete(key) {
    const cmd = new DeleteObjectCommand({ Bucket: BUCKET, Key: key });
    await r2Client.send(cmd).catch(() => {});
  },
};
