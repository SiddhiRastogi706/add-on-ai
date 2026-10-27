import { randomUUID } from 'crypto';
import axios from 'axios';
import { prisma } from '../db';
import { StorageService } from './storage.service';

const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export const ALLOWED_IMAGE_TYPES = Object.keys(EXT);
const MEDIA_PREFIX = '/api/media/';

export class MediaService {
  // S3/R2 configured ho to wahan, warna DB (MediaAsset) mein save karo
  static async saveImage(
    buffer: Buffer,
    mimeType: string,
    folder: string,
    organizationId?: string
  ): Promise<string> {
    if (StorageService.isConfigured(organizationId)) {
      const key = StorageService.getNamespacedKey(organizationId, folder, `${randomUUID()}.${EXT[mimeType] || 'png'}`);
      const upload = await StorageService.uploadBuffer(key, buffer, mimeType, organizationId);
      if (upload.success && upload.url) return upload.url;
      console.warn('[MediaService] S3 upload failed, DB fallback use ho raha hai:', upload.error);
    }

    const asset = await prisma.mediaAsset.create({
      data: { mimeType, data: buffer },
      select: { id: true },
    });
    return `${MEDIA_PREFIX}${asset.id}`;
  }

  static async getDbAsset(id: string) {
    return prisma.mediaAsset.findUnique({ where: { id } });
  }

  // URL se bytes nikalo (DB asset ya remote S3 URL)
  static async loadImage(url: string): Promise<{ buffer: Buffer; mimeType: string }> {
    if (url.startsWith(MEDIA_PREFIX)) {
      const asset = await this.getDbAsset(url.slice(MEDIA_PREFIX.length));
      if (!asset) throw new Error('Stored image not found');
      return { buffer: Buffer.from(asset.data), mimeType: asset.mimeType };
    }

    const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 20000, maxContentLength: 15 * 1024 * 1024 });
    const header = String(response.headers['content-type'] || 'image/png').split(';')[0].trim();
    return { buffer: Buffer.from(response.data), mimeType: ALLOWED_IMAGE_TYPES.includes(header) ? header : 'image/png' };
  }
}
