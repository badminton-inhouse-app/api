import { Module } from '@nestjs/common';
import { CourtsService } from './courts.service';
import { CourtsController } from './courts.controller';
import { RedisModule } from '../redis/redis.module';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  controllers: [CourtsController],
  providers: [CourtsService],
  imports: [RedisModule, DatabaseModule],
  exports: [CourtsService],
})
export class CourtsModule {}
