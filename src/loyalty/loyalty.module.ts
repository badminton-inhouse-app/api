import { Module } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { LoyaltyController } from './loyalty.controller';
import { DatabaseModule } from '../database/database.module';
import { LoyaltyEventsListener } from './listeners/loyalty-events.listener';

@Module({
  controllers: [LoyaltyController],
  providers: [LoyaltyService, LoyaltyEventsListener],
  imports: [DatabaseModule],
  exports: [LoyaltyService],
})
export class LoyaltyModule {}
