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

  async deleteKey(key: string) {
    return await this.cacheManager.del(key);
  }

  async acquireLock(
    key: string,
    value: string,
    ttl: number = 30
  ): Promise<boolean> {
    const isExisted = await this.getKey(key);
    if (isExisted) {
      return false;
    }
    try {
      await this.setKey(key, value, ttl);
      return true;
    } catch (error: any) {
      console.log('Error at acquire lock in redis: ', error);
      return false;
    }
  }

  async releaseLock(key: string, value: string): Promise<boolean> {
    const currentValue = await this.getKey(key);
    if (currentValue === value) {
      await this.deleteKey(key);
      return true;
    }
    return false;
  }
}
