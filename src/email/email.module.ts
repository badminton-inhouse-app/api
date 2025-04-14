import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  controllers: [EmailController],
  providers: [EmailService],
  imports: [DatabaseModule],
})
export class EmailModule {}
