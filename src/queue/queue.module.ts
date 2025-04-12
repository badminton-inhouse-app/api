import { forwardRef, Global, Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { BookingsModule } from '../bookings/bookings.module';

@Global()
@Module({
  controllers: [],
  providers: [QueueService],
  imports: [forwardRef(() => BookingsModule)],
  exports: [QueueService],
})
export class QueueModule {}
