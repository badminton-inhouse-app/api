import { OnEvent } from '@nestjs/event-emitter';
import { EmailService } from '../email.service';
import { BookingCompletedEvent } from 'src/bookings/events/booking-completed.event';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailEventsListener {
  constructor(private readonly emailService: EmailService) {}

  @OnEvent('booking.completed')
  async handleBookingCompletedEvent(event: BookingCompletedEvent) {
    await this.emailService.sendBookingCompletedEmail(
      event.userId,
      event.bookingId
    );
  }
}
