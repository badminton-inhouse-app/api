import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { DatabaseModule } from '../database/database.module';
import { PaymentsModule } from '../payments/payments.module';
import { BookingsEventsListener } from './listeners/bookings-events.listener';

@Module({
  controllers: [BookingsController],
  providers: [BookingsService, BookingsEventsListener],
  imports: [DatabaseModule, PaymentsModule],
  exports: [BookingsService],
})
export class BookingsModule {}
