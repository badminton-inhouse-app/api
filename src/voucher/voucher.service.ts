import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from '../database/database.module';
import { DrizzleDB } from '../database/types/drizzle';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { userVouchers, vouchers } from '../database/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class VoucherService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly loyaltyService: LoyaltyService
  ) {}

  async getAvailableVouchers(userId: string) {
    const points = await this.loyaltyService.getUserPoints(userId);

    return this.db.query.vouchers.findMany({
      where: (v, { lte }) => lte(v.requiredPoints, points),
    });
  }

  async redeemVoucher(userId: string, voucherId: string) {
    const voucher = await this.db.query.vouchers.findFirst({
      where: eq(vouchers.id, voucherId),
    });

    if (!voucher) throw new Error('Voucher not found');

    const userPoints = await this.loyaltyService.getUserPoints(userId);
    if (userPoints < voucher.requiredPoints) {
      throw new Error('Not enough points');
    }

    // Deduct points after claiming voucher
    await this.loyaltyService.addPoints(
      userId,
      -voucher.requiredPoints,
      'REDEEM',
      { voucherId }
    );

    // Assign voucher
    await this.db.insert(userVouchers).values({
      userId,
      voucherId,
      status: 'CLAIMED',
      claimedAt: new Date(),
    });
  }
}
