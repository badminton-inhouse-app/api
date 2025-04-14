import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PaymentCompletedEvent } from '../../payments/events/payment-completed.event';
import { PaymentFailedEvent } from '../../payments/events/payment-failed.event';
import { BookingsService } from '../bookings.service';

@Injectable()
export class BookingsEventsListener {
  constructor(private readonly bookingsService: BookingsService) {}

  @OnEvent('payment.completed')
  async handlePaymentCompleted(event: PaymentCompletedEvent) {
    console.log('Payment completed event received: ', event);
    await this.bookingsService.updateStatusByPaymentSessionId(
      event.paymentSessionId,
      'COMPLETED'
    );
  }

  @OnEvent('payment.failed')
  async handlePaymentFailed(event: PaymentFailedEvent) {
    await this.bookingsService.updateStatusByPaymentSessionId(
      event.paymentSessionId,
      'CANCELLED'
    );
  }
}
