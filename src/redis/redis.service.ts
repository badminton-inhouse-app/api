import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class RedisService {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async setKey(key: string, value: any, ttl: number) {
    await this.cacheManager.set(key, value, ttl);
  }

  async getKey(key: string) {
    return await this.cacheManager.get(key);
  }
}
