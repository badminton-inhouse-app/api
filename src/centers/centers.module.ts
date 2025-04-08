import { Module } from '@nestjs/common';
import { CentersService } from './centers.service';
import { CentersController } from './centers.controller';
import { DatabaseModule } from '../database/database.module';
import { RedisModule } from '../redis/redis.module';
import { CourtsModule } from '../courts/courts.module';

@Module({
  controllers: [CentersController],
  providers: [CentersService],
  imports: [DatabaseModule, RedisModule, CourtsModule],
})
export class CentersModule {}
