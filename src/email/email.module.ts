import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { DatabaseModule } from '../database/database.module';
import { EmailEventsListener } from './listeners/email-events.listener';
import { BookingsModule } from '../bookings/bookings.module';

@Module({
  controllers: [EmailController],
  providers: [EmailService, EmailEventsListener],
  imports: [DatabaseModule, BookingsModule],
})
export class EmailModule {}
