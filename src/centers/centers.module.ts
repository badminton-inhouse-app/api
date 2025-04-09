import { Module } from '@nestjs/common';
import { CentersService } from './centers.service';
import { CentersController } from './centers.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  controllers: [CentersController],
  providers: [CentersService],
  imports: [DatabaseModule],
})
export class CentersModule {}
