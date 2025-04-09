import { Module } from '@nestjs/common';
import { CourtsService } from './courts.service';
import { CourtsController } from './courts.controller';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  controllers: [CourtsController],
  providers: [CourtsService],
  imports: [DatabaseModule],
  exports: [CourtsService],
})
export class CourtsModule {}
