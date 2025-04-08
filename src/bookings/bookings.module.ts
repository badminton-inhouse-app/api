import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  controllers: [BookingsController],
  providers: [BookingsService],
  imports: [DatabaseModule],
  exports: [BookingsService],
})
export class BookingsModule {}
