import dotenv from 'dotenv';
dotenv.config();
import Redis, { RedisOptions } from 'ioredis';

class RedisManager {
  private client: Redis | null = null;
  private isConnected: boolean = false;
  private inMemoryFallback: Map<string, { value: string; expiresAt?: number }> = new Map();
  private connectionAttempted: boolean = false;

  constructor() {
    this.ensureClient();
  }

  private ensureClient() {
    if (this.client || this.connectionAttempted) return;
    this.connectionAttempted = true;
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl || redisUrl.trim() === '') {
      console.log('ℹ️ [Redis] REDIS_URL not configured. Operating in high-speed in-memory cache mode.');
      return;
    }

    try {
      let finalUrl = redisUrl.trim();

      // Normalize if user provided standard redis:// with TLS expectations
      const isUpstash = finalUrl.includes('upstash.io');
      if (isUpstash && finalUrl.startsWith('redis://')) {
        finalUrl = finalUrl.replace(/^redis:\/\//, 'rediss://');
      }

      const options: RedisOptions = {
        maxRetriesPerRequest: 2,
        connectTimeout: 8000,
        lazyConnect: false,
        retryStrategy(times) {
          if (times > 5) {
            console.warn('⚠️ [Redis] Reconnect limit reached. Failing over to in-memory cache.');
            return null;
          }
          return Math.min(times * 1000, 3000);
        },
      };

      if (finalUrl.startsWith('rediss://') || isUpstash) {
        options.tls = {
          rejectUnauthorized: false,
        };
      }

      this.client = new Redis(finalUrl, options);

      this.client.on('connect', () => {
        this.isConnected = true;
        console.log('⚡ [Redis] Connected to Upstash Redis TLS successfully.');
      });

      this.client.on('ready', () => {
        this.isConnected = true;
        console.log('🟢 [Redis] Upstash Redis ready for cache and atomic slot operations.');
      });

      this.client.on('error', (err: any) => {
        this.isConnected = false;
        console.error('⚠️ [Redis Error]:', err.message || err);
      });

      this.client.on('close', () => {
        this.isConnected = false;
      });
    } catch (err: any) {
      console.error('⚠️ [Redis Init Error]:', err.message || err);
      this.client = null;
      this.isConnected = false;
    }
  }

  public isReady(): boolean {
    return this.client !== null && (this.isConnected || this.client.status === 'ready');
  }

  public async ping(): Promise<{ ok: boolean; response: string; latencyMs: number }> {
    const start = Date.now();
    if (this.client && this.client.status !== 'end') {
      try {
        const pong = await this.client.ping();
        const latencyMs = Date.now() - start;
        this.isConnected = true;
        return { ok: pong === 'PONG', response: pong, latencyMs };
      } catch (err: any) {
        return { ok: false, response: err.message, latencyMs: Date.now() - start };
      }
    }

    // In-memory fallback
    return { ok: true, response: 'PONG (In-Memory Fallback)', latencyMs: 0 };
  }

  public async get(key: string): Promise<string | null> {
    if (this.client && this.client.status !== 'end') {
      try {
        return await this.client.get(key);
      } catch (err) {
        console.warn(`[Redis] Error getting key ${key}, falling back to memory`);
      }
    }

    // In-memory fallback
    const entry = this.inMemoryFallback.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.inMemoryFallback.delete(key);
      return null;
    }
    return entry.value;
  }

  public async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.client && this.client.status !== 'end') {
      try {
        if (ttlSeconds && ttlSeconds > 0) {
          await this.client.set(key, value, 'EX', ttlSeconds);
        } else {
          await this.client.set(key, value);
        }
        return;
      } catch (err) {
        console.warn(`[Redis] Error setting key ${key}, falling back to memory`);
      }
    }

    // In-memory fallback
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.inMemoryFallback.set(key, { value, expiresAt });
  }

  public async del(key: string): Promise<void> {
    if (this.client && this.client.status !== 'end') {
      try {
        await this.client.del(key);
        return;
      } catch (err) {
        console.warn(`[Redis] Error deleting key ${key}`);
      }
    }
    this.inMemoryFallback.delete(key);
  }

  public async incr(key: string): Promise<number> {
    if (this.client && this.client.status !== 'end') {
      try {
        return await this.client.incr(key);
      } catch (err) {
        console.warn(`[Redis] Error incr key ${key}, falling back to memory`);
      }
    }

    const current = parseInt(this.inMemoryFallback.get(key)?.value || '0', 10);
    const next = current + 1;
    this.inMemoryFallback.set(key, { value: next.toString() });
    return next;
  }

  public async getStatus(): Promise<{
    configured: boolean;
    connected: boolean;
    provider: string;
    endpoint: string;
    tls: boolean;
    pingLatencyMs?: number;
    mode: 'UPSTASH_TLS' | 'LOCAL_REDIS' | 'IN_MEMORY_FALLBACK';
  }> {
    const rawUrl = process.env.REDIS_URL || '';
    const configured = rawUrl.length > 0;
    const isUpstash = rawUrl.includes('upstash.io');
    const tls = rawUrl.startsWith('rediss://') || isUpstash;

    let endpoint = 'none';
    try {
      if (rawUrl) {
        const parsed = new URL(rawUrl.replace('rediss://', 'http://').replace('redis://', 'http://'));
        endpoint = `${parsed.hostname}:${parsed.port || 6379}`;
      }
    } catch {
      endpoint = isUpstash ? 'promoted-hog-311621.upstash.io:6379' : 'redis-host';
    }

    const pingRes = await this.ping();

    return {
      configured,
      connected: this.isReady() || pingRes.ok,
      provider: isUpstash ? 'Upstash Redis (Serverless TLS)' : configured ? 'Custom Redis' : 'In-Memory Cache',
      endpoint,
      tls,
      pingLatencyMs: pingRes.latencyMs,
      mode: (pingRes.ok && pingRes.response === 'PONG')
        ? (isUpstash ? 'UPSTASH_TLS' : 'LOCAL_REDIS')
        : 'IN_MEMORY_FALLBACK',
    };
  }

  public getRawClient(): Redis | null {
    return this.client;
  }
}

export const RedisService = new RedisManager();
