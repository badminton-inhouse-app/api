import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from '../database/database.module';
import { DrizzleDB } from '../database/types/drizzle';
import { bookings, courts } from '../database/schema';
import { and, eq, ne } from 'drizzle-orm';
import { RedisService } from '../redis/redis.service';
import { CourtsService } from '../courts/courts.service';
import { BookingCenterDto } from './dto/booking-center.dto';

@Injectable()
export class BookingsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    @Inject() private readonly redisService: RedisService,
    @Inject() private readonly courtsService: CourtsService
  ) {}

  // This method checks if the requested time is valid for booking.
  // parameter: startTime in milliseconds
  // return: boolean
  checkIfTimeValid(startTime: number, endTime: number) {
    /// Check if the start time is greater than or equal end time
    if (startTime >= endTime) {
      return false;
    }

    const startDT = new Date(startTime);
    const endDT = new Date(endTime);
    const minimumHours = 2;

    // Check if the requested start time is in break period (from 11AM to 12PM)
    if (startDT.getHours() === 11 || endDT.getHours() === 11) {
      return false;
    }

    // Check if the requested start time is in between 7AM and 11AM
    if (
      startDT.getHours() < 7 ||
      startDT.getHours() >= 23 ||
      endDT.getHours() < 7 ||
      endDT.getHours() >= 23
    ) {
      return false;
    }

    // Check if the requested booking hours is less than 2 hours
    if (endDT.getHours() - startDT.getHours() < minimumHours) {
      return false;
    }
  }

  async getAvailableCourtsByCenterId(centerId: string) {
    return await this.db
      .select()
      .from(courts)
      .where(
        and(eq(courts.centerId, centerId), eq(courts.status, 'AVAILABLE'))
      );
  }

  async pessimisticLock(
    centerId: string,
    courtId: string,
    userId: string,
    startTime: number
  ) {
    // Generate a unique lock key by combine the centerId, courtId, and start time
    const lockKey = `center:${centerId}:court:${courtId}:${startTime}:lock`;
    // Generate a unique lock value by combining the userId and current timestamp
    const lockValue = `${userId}-${Date.now()}`;
    const lockAcquired = await this.redisService.acquireLock(
      lockKey,
      lockValue,
      3000
    );

    if (!lockAcquired) {
      return null;
    }

    return {
      lockKey,
      lockValue,
    };
  }

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

  async booking(bookingCenterDto: BookingCenterDto, userId: string) {
    const { centerId, startTime, endTime } = bookingCenterDto;

    if (this.checkIfTimeValid(startTime, endTime) === false) {
      throw new Error('Invalid time. Please try again.');
    }

    // Check if any courts is available in the center
    const availableCourts = await this.getAvailableCourtsByCenterId(centerId);

    if (availableCourts.length === 0) {
      throw new Error('No courts available in this center.');
    }

    // Iterate through available courts and try to acquire a lock
    for (let i = 0; i < availableCourts.length; i++) {
      const court = availableCourts[i];
      const courtId = court.id;

      // Check overlap booking for the court
      const overlapBooking = await this.getOverlapBooking(
        courtId,
        startTime,
        endTime
      );

      // Skip this court if it is overlapping with another booking
      if (overlapBooking) {
        continue;
      }

      // Acquire a lock on the court
      const lockAcquired = await this.pessimisticLock(
        centerId,
        court.id,
        userId,
        startTime
      );

      // If lock is not acquired, continue to the next court
      if (!lockAcquired) {
        continue;
      }

      // If lock is acquired, proceed with booking and break the loop, remove the lock from Redis
      const { lockKey, lockValue } = lockAcquired;
      const startTimeD = new Date(startTime);
      const endTimeD = new Date(endTime);

      await new Promise((resolve) => setTimeout(resolve, 20000)); // Simulate booking delay

      try {
        const result = await this.db
          .insert(bookings)
          .values({
            courtId: courtId,
            userId: userId,
            startTime: startTimeD,
            endTime: endTimeD,
            status: 'COMPLETED',
          })
          .returning();

        if (result.length === 0) {
          throw new Error('Failed to book court.');
        }
        return result;
      } catch (err: any) {
        console.log('Error booking court: ', err);
        throw new Error('Failed to book court.');
      } finally {
        await this.redisService.releaseLock(lockKey, lockValue);
      }
    }
  }
}
