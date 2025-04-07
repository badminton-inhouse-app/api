import { Module } from '@nestjs/common';
import { CentersService } from './centers.service';
import { CentersController } from './centers.controller';
import { DatabaseModule } from '../database/database.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  controllers: [CentersController],
  providers: [CentersService],
  imports: [DatabaseModule, RedisModule],
})
export class CentersModule {}
