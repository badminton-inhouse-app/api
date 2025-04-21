import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from '../database/database.module';
import { DrizzleDB } from '../database/types/drizzle';
import { userPoints } from '../database/schema';
import { eq, sql } from 'drizzle-orm';

@Injectable()
export class LoyaltyService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async addPoints(
    userId: string,
    points: number,
    type: 'BOOKING' | 'ADDTIONAL_SPENDING' | 'REDEEM',
    metadata: Record<string, any> = {}
  ) {
    await this.db.insert(userPoints).values({
      userId,
      points,
      type,
      metadata,
    });
  }

  async addPointsForBooking(userId: string, bookingId: string) {
    const booking = await this.db.query.bookings.findFirst({
      where: (b, { eq }) => eq(b.id, bookingId),
    });
    if (!booking) throw new Error('Booking not found');

    const { endTime, startTime } = booking;
    if (!endTime || !startTime) throw new Error('Booking time not found');
    const durationInHours = Math.floor(
      (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
    );
    // define total points to be added for each booking hour. eg: 100 points for 1 hour
    const totalPoints = durationInHours * 100;
    await this.addPoints(userId, totalPoints, 'BOOKING');
  }

  async addPointsForSpending(userId: string, amountSpent: number) {
    const points = Math.floor(amountSpent); // define how many points to give for each currency spent. eg: 1 points for 1000 VND
    await this.addPoints(userId, points, 'ADDTIONAL_SPENDING');
  }

  async getUserPoints(userId: string): Promise<number> {
    const result = await this.db
      .select({
        total: sql<number>`COALESCE(SUM(${userPoints.points}), 0)`,
      })
      .from(userPoints)
      .where(eq(userPoints.userId, userId))
      .execute();

    return result[0]?.total ?? 0;
  }
}
