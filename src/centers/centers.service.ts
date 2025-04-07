import { Inject, Injectable } from '@nestjs/common';
import { BookingCenterDto } from './dto/booking-center.dto';
import { DrizzleDB } from '../database/types/drizzle';
import { DRIZZLE } from '../database/database.module';
import { RedisService } from '../redis/redis.service';
import { and, eq, inArray } from 'drizzle-orm';
import { courts, bookings } from '../database/schema';

@Injectable()
export class CentersService {
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

  async getCenterAvailableCourts(centerId: string) {
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

  async booking(bookingCenterDto: BookingCenterDto, userId: string) {
    const { centerId, startTime } = bookingCenterDto;

    if (this.checkIfTimeValid(startTime) === false) {
      throw new Error('Invalid time. Please try again.');
    }

    // Check if any courts is available in the center
    const availableCourts = await this.getCenterAvailableCourts(centerId);

    if (availableCourts.length === 0) {
      throw new Error('No courts available in this center.');
    }

    // Iterate through available courts and try to acquire a lock
    for (let i = 0; i < availableCourts.length; i++) {
      const court = availableCourts[i];
      const courtId = court.id;

      // Check if the court is already booked or reserved
      const existingBookings = await this.db
        .select()
        .from(bookings)
        .where(
          and(
            eq(bookings.courtId, courtId),
            eq(bookings.startTime, new Date(startTime)),
            inArray(bookings.status, ['PENDING', 'COMPLETED'])
          )
        );

      // Skip this court if it is already booked
      if (existingBookings.length > 0) {
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
      const twoHoursInMilliseconds = 2 * 60 * 60 * 1000;
      const requestedStartTime = new Date(startTime);
      const requestedEndTime = new Date(
        requestedStartTime.getTime() + twoHoursInMilliseconds
      );

      await new Promise((resolve) => setTimeout(resolve, 1000000)); // Simulate booking delay

      try {
        const result = await this.db
          .insert(bookings)
          .values({
            courtId: courtId,
            userId: userId,
            startTime: requestedStartTime,
            endTime: requestedEndTime,
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
