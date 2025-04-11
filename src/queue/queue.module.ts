import { forwardRef, Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { BookingsModule } from '../bookings/bookings.module';

@Module({
  controllers: [],
  providers: [QueueService],
  imports: [forwardRef(() => BookingsModule)],
  exports: [QueueService],
})
export class QueueModule {}
