import { Module } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { LoyaltyController } from './loyalty.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  controllers: [LoyaltyController],
  providers: [LoyaltyService],
  imports: [DatabaseModule],
  exports: [LoyaltyService],
})
export class LoyaltyModule {}
