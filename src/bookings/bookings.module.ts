import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { DatabaseModule } from '../database/database.module';
import { RedisModule } from '../redis/redis.module';
import { CourtsModule } from '../courts/courts.module';

@Module({
  controllers: [BookingsController],
  providers: [BookingsService],
  imports: [DatabaseModule, RedisModule, CourtsModule],
  exports: [BookingsService],
})
export class BookingsModule {}
