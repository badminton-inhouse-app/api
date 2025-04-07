import { courts, orders } from './../database/schema/index';
import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from 'src/database/database.module';
import { DrizzleDB } from '../database/types/drizzle';
import { RedisService } from '../redis/redis.service';
import { BookingCourtDto } from './dtos/booking-court.dto';

@Injectable()
export class CourtsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    @Inject() private readonly redisService: RedisService
  ) {}

  // This method checks if the requested time is valid for booking.
  // parameter: startTime in milliseconds
  // return: boolean
  checkIfTimeValid(startTime: number) {
    const startDT = new Date(startTime);
    // Check if the requested start time is in break period (from 11AM to 12PM)
    if (startDT.getHours() === 11) {
      return false;
    }
    // Check if the requested start time is in between 7AM and 11AM
    if (startDT.getHours() < 7 || startDT.getHours() >= 23) {
      return false;
    }
  }

  async pessimisticLock(courtId: string, userId: string, startTime: number) {
    const lockKey = `court:${courtId}:${startTime}:lock`;
    const lockValue = `${userId}-${Date.now()}`;
    const lockAcquired = await this.redisService.acquireLock(
      lockKey,
      lockValue
    );

    if (!lockAcquired) {
      return null;
    }

    return {
      lockKey,
      lockValue,
    };
  }

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

  async bookingCourt(bookingCourtDto: BookingCourtDto, userId: string) {
    const { courtId, startTime } = bookingCourtDto;

    if (this.checkIfTimeValid(startTime) === false) {
      throw new Error('Invalid time. Please try again.');
    }

    const isCourtAvailable = await this.checkIfCourtAvailable(courtId);

    if (!isCourtAvailable) {
      throw new Error('Court is not available.');
    }

    const lockAcquired = await this.pessimisticLock(courtId, userId, startTime);

    if (!lockAcquired) {
      throw new Error('Court is already being booked. Please try again later.');
    }

    const { lockKey, lockValue } = lockAcquired;

    try {
      const twoHoursInMilliseconds = 2 * 60 * 60 * 1000;
      const requestedStartTime = new Date(startTime);
      const requestedEndTime = new Date(
        requestedStartTime.getTime() + twoHoursInMilliseconds
      );

      await new Promise((resolve) => setTimeout(resolve, 1000000)); // Simulate booking delay

      const result = await this.db
        .insert(orders)
        .values({
          court_id: courtId,
          user_id: userId,
          start_time: requestedStartTime,
          end_time: requestedEndTime,
          status: 'COMPLETED',
        })
        .returning();

      if (result.length === 0) {
        throw new Error('Failed to book court.');
      }
    } catch (err: any) {
      console.log('Error booking court: ', err);
      throw new Error('Failed to book court.');
    } finally {
      await this.redisService.releaseLock(lockKey, lockValue);
    }
  }
}
