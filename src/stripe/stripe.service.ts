import { Inject, Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { eq } from 'drizzle-orm';
import { ConfigService } from '@nestjs/config';
import { PaymentMethod } from '../constants/enums';
import { DRIZZLE } from '../database/database.module';
import { DrizzleDB } from '../database/types/drizzle';
import { bookings } from '../database/schema';
import { BookingsService } from '../bookings/bookings.service';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(
    @Inject() private readonly configService: ConfigService,
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly bookingsService: BookingsService
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
      console.warn('Payment session not found');
      return {
        message: 'Payment session not found',
        received: false,
      };
    }

    // Retrieve Booking by PaymentSessionId
    const paymentSessionId = `${PaymentMethod.STRIPE}_${paymentIntent.id}`;
    const booking =
      await this.bookingsService.findByPaymentSessionId(paymentSessionId);

    if (!booking) {
      console.warn('Booking not found');
      return {
        message: 'Booking not found',
        received: false,
      };
    }

    // Handle Payment Success
    if (event.type === 'payment_intent.succeeded') {
      if (['COMPLETED', 'CANCELLED'].includes(booking.status)) {
        console.warn(
          `Booking with id ${booking.id} already ${booking.status.toLowerCase()}`
        );
        return {
          message: `Booking already ${booking.status.toLowerCase()}`,
          received: false,
        };
      }

      await this.db
        .update(bookings)
        .set({ status: 'COMPLETED' })
        .where(eq(bookings.paymentSessionId, paymentSessionId));
    }

    // Handle Payment Failure
    if (event.type === 'payment_intent.payment_failed') {
      await this.db
        .update(bookings)
        .set({ status: 'CANCELLED' })
        .where(eq(bookings.id, booking.id));
    }

    return { received: true };
  }
}
