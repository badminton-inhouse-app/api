import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { BookingsModule } from '../bookings/bookings.module';

@Module({
  controllers: [],
  providers: [QueueService],
  imports: [BookingsModule],
})
export class QueueModule {}
