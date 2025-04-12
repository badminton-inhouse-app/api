import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { DatabaseModule } from '../database/database.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  controllers: [BookingsController],
  providers: [BookingsService],
  imports: [DatabaseModule, RedisModule],
  exports: [BookingsService],
})
export class BookingsModule {}
