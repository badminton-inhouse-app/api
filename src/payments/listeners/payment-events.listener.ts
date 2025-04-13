import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PaymentsService } from '../payments.service';
import { PaymentCompletedEvent } from '../events/payment-completed.event';
import { PaymentFailedEvent } from '../events/payment-failed.event';

@Injectable()
export class PaymentEventsListener {
  constructor(private readonly paymentsService: PaymentsService) {}

  @OnEvent('payment.completed')
  async handlePaymentCompleted(event: PaymentCompletedEvent) {
    await this.paymentsService.completePaymentSession(event.paymentSessionId);
  }

  @OnEvent('payment.failed')
  async handlePaymentFailed(event: PaymentFailedEvent) {
    await this.paymentsService.cancelPaymentSession(event.paymentSessionId);
  }
}
