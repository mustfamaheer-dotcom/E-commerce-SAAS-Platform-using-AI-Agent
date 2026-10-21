// apps/api/src/redis/redis.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client!: Redis;
  private readonly logger = new Logger(RedisService.name);

  onModuleInit() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.client = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
    });

    this.client.connect().catch((err) => {
      this.logger.warn(`Redis connection failed: ${err.message}. Running with fallback memory cache.`);
    });
  }

  async get(key: string): Promise<string | null> {
    try {
      if (this.client && this.client.status === 'ready') {
        return await this.client.get(key);
      }
    } catch (err: any) {
      this.logger.error(`Redis GET error for key ${key}: ${err.message}`);
    }
    return null;
  }

  async set(key: string, value: string, mode?: string, duration?: number): Promise<void> {
    try {
      if (this.client && this.client.status === 'ready') {
        if (mode === 'EX' && duration) {
          await this.client.set(key, value, 'EX', duration);
        } else {
          await this.client.set(key, value);
        }
      }
    } catch (err: any) {
      this.logger.error(`Redis SET error for key ${key}: ${err.message}`);
    }
  }

  async del(key: string): Promise<void> {
    try {
      if (this.client && this.client.status === 'ready') {
        await this.client.del(key);
      }
    } catch (err: any) {
      this.logger.error(`Redis DEL error for key ${key}: ${err.message}`);
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
    }
  }
}
