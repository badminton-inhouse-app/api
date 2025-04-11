import { forwardRef, Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { DatabaseModule } from '../database/database.module';
import { RedisModule } from '../redis/redis.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  controllers: [BookingsController],
  providers: [BookingsService],
  imports: [DatabaseModule, RedisModule, forwardRef(() => QueueModule)],
  exports: [BookingsService],
})
export class BookingsModule {}
