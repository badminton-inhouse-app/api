import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from 'src/database/database.module';
import { DrizzleDB } from '../database/types/drizzle';
import { RedisService } from '../redis/redis.service';
import { ne } from 'drizzle-orm';

@Injectable()
export class CourtsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    @Inject() private readonly redisService: RedisService
  ) {}

  async getOverlapBooking(courtId: string, starTime: number, endTime: number) {
    const startTimeD = new Date(starTime);
    const endTimeD = new Date(endTime);
    return await this.db.query.bookings.findFirst({
      where: (bookings, { eq, lte, gte, or, and }) =>
        and(
          eq(bookings.courtId, courtId),
          ne(bookings.status, 'CANCELLED'),
          or(
            lte(bookings.startTime, startTimeD),
            gte(bookings.endTime, endTimeD)
          )
        ),
    });
  }
}
