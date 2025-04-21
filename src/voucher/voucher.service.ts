import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from '../database/database.module';
import { DrizzleDB } from '../database/types/drizzle';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { userVouchers, vouchers } from '../database/schema';
import { eq } from 'drizzle-orm';
import CreateVoucherDto from './dto/create-voucher.dto';

@Injectable()
export class VoucherService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly loyaltyService: LoyaltyService
  ) {}

  async create(createVoucherDto: CreateVoucherDto) {
    try {
      console.log('createVoucherDto: ', createVoucherDto);
      const voucher = await this.db
        .insert(vouchers)
        .values({
          validFrom: new Date(createVoucherDto.validFrom),
          validTo: new Date(createVoucherDto.validTo),
          name: createVoucherDto.name,
          desc: createVoucherDto.desc,
          discountType: createVoucherDto.discountType as any,
          discountValue: createVoucherDto.discountValue,
          requiredPoints: createVoucherDto.requiredPoints,
          type: createVoucherDto.type as any,
        })
        .returning();

      if (voucher.length === 0) {
        return null;
      }

      return voucher[0];
    } catch (err: any) {
      console.log('Error creating voucher: ', err);
      return null;
    }
  }

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
