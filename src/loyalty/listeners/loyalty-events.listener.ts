import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { LoyaltyService } from '../loyalty.service';
import { BookingCompletedEvent } from '../../bookings/events/booking-completed.event';

@Injectable()
export class LoyaltyEventsListener {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @OnEvent('booking.completed')
  async handlePaymentCompleted(event: BookingCompletedEvent) {
    const { bookingId, userId } = event;
    console.log('Loyalty event received: ', event);
    await this.loyaltyService.addPointsForBooking(userId, bookingId);
  }
}
