import { Inject, Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { PaymentMethod } from '../constants/enums';
import { DRIZZLE } from '../database/database.module';
import { DrizzleDB } from '../database/types/drizzle';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PaymentCompletedEvent } from '../payments/events/payment-completed.event';
import { PaymentFailedEvent } from '../payments/events/payment-failed.event';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(
    @Inject() private readonly configService: ConfigService,
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly eventEmitter: EventEmitter2
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      console.log('STRIPE_SECRET_KEY is not defined in environment variables.');
      return;
    }
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-03-31.basil',
    });
  }

  async createSession(
    bookingId: string,
    amount: number,
    currency: string = 'vnd'
  ) {
    try {
      console.log('Creating session for bookingId: ', amount);
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amount,
        currency,
        payment_method_types: ['card'],
        metadata: {
          bookingId,
        },
      });
      return {
        paymentSessionId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
      };
    } catch (err: any) {
      console.error('Error creating stripe payment intent: ', err);
      return null;
    }
  }

  async cancelSession(paymentIntentId: string) {
    return this.stripe.paymentIntents.cancel(paymentIntentId);
  }

  async retrieveSession(paymentIntentId: string) {
    return this.stripe.paymentIntents.retrieve(paymentIntentId);
  }

  async handleWebhook(sig: string, payload: Buffer) {
    // Construct Stripe Event
    const stripeWebhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET'
    );
    if (!stripeWebhookSecret) {
      console.log(
        'STRIPE_WEBHOOK_SECRET is not defined in environment variables.'
      );
      return;
    }
    const event = this.stripe.webhooks.constructEvent(
      payload,
      sig,
      stripeWebhookSecret
    );

    // Retrieve Updated PaymentIntent
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    // paymentIntent = await this.retrieveSession(paymentIntent.id);

    if (!paymentIntent) {
      console.warn('Payment intent not found');
      return {
        message: 'Payment intent not found',
        received: false,
      };
    }

    // Retrieve payment session by payment session id
    const paymentSessionId = `${PaymentMethod.STRIPE}_${paymentIntent.id}`;
    const paymentSession = await this.db.query.paymentSessions.findFirst({
      where: (paymentSessions, { eq }) =>
        eq(paymentSessions.paymentSessionId, paymentSessionId),
    });

    if (!paymentSession) {
      console.warn('Payment session not found');
      return {
        message: 'Payment session not found',
        received: false,
      };
    }

    // Handle Payment Success
    if (event.type === 'payment_intent.succeeded') {
      if (['COMPLETED', 'CANCELLED'].includes(paymentSession.status)) {
        console.warn(
          `Payment session with id ${paymentSession.id} already ${paymentSession.status.toLowerCase()}`
        );
        return {
          message: `Payment session already ${paymentSession.status.toLowerCase()}`,
          received: false,
        };
      }

      // Emit payment completed event
      this.eventEmitter.emit(
        'payment.completed',
        new PaymentCompletedEvent(paymentSessionId)
      );
    }

    // Handle Payment Failure
    if (event.type === 'payment_intent.payment_failed') {
      // Update payment session status to CANCELLED
      this.eventEmitter.emit(
        'payment.failed',
        new PaymentFailedEvent(paymentSessionId)
      );
    }

    return { received: true };
  }
}
