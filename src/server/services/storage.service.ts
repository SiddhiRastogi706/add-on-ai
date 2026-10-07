import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import axios from 'axios';

export interface StorageConfig {
  endpoint?: string;
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  bucket?: string;
  publicUrl?: string;
}

export interface StorageUploadResult {
  success: boolean;
  url: string;
  key: string;
  error?: string;
}

export class StorageService {
  private static cachedClient: S3Client | null = null;
  private static cachedConfigHash: string = '';

  /**
   * Single credential helper resolving S3 / Cloudflare R2 storage credentials.
   * Can be swapped to per-organization encrypted DB storage in the future.
   */
  static getConfig(_organizationId?: string): StorageConfig {
    return {
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION || 'auto',
      accessKeyId: process.env.S3_KEY,
      secretAccessKey: process.env.S3_SECRET,
      bucket: process.env.S3_BUCKET,
      publicUrl: process.env.S3_PUBLIC_URL,
    };
  }

  /**
   * Checks whether storage credentials and public delivery URL are fully configured.
   */
  static isConfigured(organizationId?: string): boolean {
    const config = this.getConfig(organizationId);
    return Boolean(config.accessKeyId && config.secretAccessKey && config.bucket && config.publicUrl);
  }

  /**
   * Namespaces keys by organizationId to maintain strict multi-tenant separation.
   * Format: "org_{orgId}/{folder}/{filename}"
   */
  static getNamespacedKey(organizationId: string | undefined, folder: string, filename: string): string {
    const org = organizationId || 'global';
    const cleanFolder = folder.replace(/^\/+|\/+$/g, '');
    const cleanFilename = filename.replace(/^\/+/g, '');
    return `org_${org}/${cleanFolder}/${cleanFilename}`;
  }

  /**
   * Returns a configured S3 client (cached per credentials configuration).
   */
  private static getClient(config: StorageConfig): S3Client | null {
    if (!config.accessKeyId || !config.secretAccessKey || !config.bucket) {
      return null;
    }

    const hash = `${config.endpoint}_${config.region}_${config.accessKeyId}`;
    if (this.cachedClient && this.cachedConfigHash === hash) {
      return this.cachedClient;
    }

    this.cachedClient = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
    this.cachedConfigHash = hash;
    return this.cachedClient;
  }

  /**
   * Uploads a raw Buffer to S3 / Cloudflare R2 and returns its public CDN URL.
   */
  static async uploadBuffer(
    key: string,
    buffer: Buffer,
    contentType: string = 'image/png',
    organizationId?: string
  ): Promise<StorageUploadResult> {
    const config = this.getConfig(organizationId);
    if (!this.isConfigured(organizationId)) {
      return {
        success: false,
        url: '',
        key,
        error: 'Storage not configured (missing S3_KEY, S3_SECRET, S3_BUCKET, or S3_PUBLIC_URL)',
      };
    }

    const client = this.getClient(config);
    if (!client) {
      return {
        success: false,
        url: '',
        key,
        error: 'Failed to initialize S3 client',
      };
    }

    try {
      await client.send(
        new PutObjectCommand({
          Bucket: config.bucket,
          Key: key,
          Body: buffer,
          ContentType: contentType,
        })
      );

      const baseUrl = config.publicUrl!.replace(/\/+$/, '');
      const cleanKey = key.replace(/^\/+/, '');
      const publicUrl = `${baseUrl}/${cleanKey}`;

      return {
        success: true,
        url: publicUrl,
        key,
      };
    } catch (err: any) {
      console.error('[StorageService] uploadBuffer error:', err.message);
      return {
        success: false,
        url: '',
        key,
        error: err.message,
      };
    }
  }

  /**
   * Downloads media from a remote URL (such as Kling AI or Pollinations) and persists
   * it in S3 / R2 storage so the media URL does not expire.
   * If storage is not configured, returns the original URL.
   */
  static async uploadFromUrl(
    sourceUrl: string,
    key: string,
    contentType?: string,
    organizationId?: string
  ): Promise<StorageUploadResult> {
    if (!this.isConfigured(organizationId)) {
      return {
        success: false,
        url: sourceUrl, // Fall back to source URL
        key,
        error: 'Storage not configured; using original URL',
      };
    }

    try {
      const response = await axios.get(sourceUrl, {
        responseType: 'arraybuffer',
        timeout: 20000,
      });

      const buffer = Buffer.from(response.data);
      const rawHeader = response.headers?.['content-type'];
      const detectedContentType: string =
        contentType || (typeof rawHeader === 'string' ? rawHeader : 'image/png');

      const uploadResult = await this.uploadBuffer(
        key,
        buffer,
        detectedContentType,
        organizationId
      );

      if (uploadResult.success) {
        return uploadResult;
      }

      // If upload failed, return original URL as fallback
      return {
        success: false,
        url: sourceUrl,
        key,
        error: uploadResult.error,
      };
    } catch (err: any) {
      console.error('[StorageService] uploadFromUrl download error:', err.message);
      return {
        success: false,
        url: sourceUrl, // Fallback to source URL
        key,
        error: err.message,
      };
    }
  }
}
