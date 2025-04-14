import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from '../database/database.module';
import { DrizzleDB } from '../database/types/drizzle';
import { userPoints, userVouchers } from '../database/schema';
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

    //Get user's ttotal points
    const totalPointsResult = await this.getUserPoints(userId);

    //Get all unlockable vouchers base on total points and voucher's required points
    const unlockableVouchers = await this.db.query.vouchers.findMany({
      where: (v, { lte }) => lte(v.requiredPoints, totalPointsResult),
    });

    //Check what voucher are already owned by user
    const ownedVouchers = await this.db.query.userVouchers.findMany({
      where: (v, { eq }) => eq(v.userId, userId),
      columns: {
        voucherId: true,
      },
    });
    const ownedVoucherIds = ownedVouchers.map((v) => v.voucherId);

    const newVouchers = unlockableVouchers.filter(
      (voucher) => !ownedVoucherIds.includes(voucher.id)
    );

    const now = new Date();
    const values = newVouchers.map((voucher) => ({
      userId,
      voucherId: voucher.id,
      status: 'CLAIMED' as any,
      claimedAt: now,
    }));

    if (values.length === 0) return;

    await this.db.transaction(async (trx) => {
      await trx.insert(userVouchers).values(values);
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
