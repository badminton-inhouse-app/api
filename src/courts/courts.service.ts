import { courts } from './../database/schema/index';
import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from 'src/database/database.module';
import { DrizzleDB } from '../database/types/drizzle';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class CourtsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    @Inject() private readonly redisService: RedisService
  ) {}

  async checkIfCourtAvailable(courtId: string) {
    try {
      const court = await this.db.query.courts.findFirst({
        where: eq(courts.id, courtId),
      });

      if (!court || court.status !== 'AVAILABLE') {
        return false;
      }

      return court;
    } catch (err: any) {
      console.error('Error checking court availability: ', err);
      return false;
    }
  }
}
