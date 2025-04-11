import { DatabaseModule } from './../database/database.module';
import { Module } from '@nestjs/common';
import { VoucherService } from './voucher.service';
import { VoucherController } from './voucher.controller';
import { LoyaltyModule } from '../loyalty/loyalty.module';

@Module({
  controllers: [VoucherController],
  providers: [VoucherService],
  imports: [DatabaseModule, LoyaltyModule],
})
export class VoucherModule {}
