import { PaymentMethod } from './../constants/enums';
import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from '../database/database.module';
import { DrizzleDB } from '../database/types/drizzle';
import { StripeService } from '../stripe/stripe.service';
import { paymentSessions } from '../database/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class PaymentsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly stripeService: StripeService
  ) {}

  async createSession(
    userId: string,
    bookingId: string,
    amount: number,
    paymentMethod: PaymentMethod,
    currency: string = 'vnd'
  ) {
    if (currency !== 'vnd') {
      throw new Error('Unsupported currency. Only VND is supported.');
    }

    let paymentSessionId: string | null = null;
    let clientSecret: string | null = null;

    switch (paymentMethod) {
      case PaymentMethod.MOMO:
        break;
      case PaymentMethod.BANK_TRANSFER:
        break;
      case PaymentMethod.CASH:
        break;
      case PaymentMethod.VISA:
        break;
      case PaymentMethod.MASTER_CARD:
        break;
      case PaymentMethod.PAYPAL:
        break;
      case PaymentMethod.INTERNET_BANKING:
        break;
      case PaymentMethod.STRIPE: {
        const result = await this.stripeService.createSession(
          bookingId,
          amount,
          currency
        );
        if (result) {
          paymentSessionId = result.paymentSessionId;
          clientSecret = result.clientSecret;
        }
        break;
      }
      default:
        throw new Error('Unsupported payment method.');
    }

    if (!paymentSessionId || !clientSecret) {
      throw new Error('Failed to create payment session.');
    }

    // Create a new payment session in the database
    try {
      await this.db.insert(paymentSessions).values({
        userId,
        bookingId,
        paymentMethod,
        paymentSessionId: `${paymentMethod}_${paymentSessionId}`,
        amount: amount.toFixed(2),
        status: 'PENDING',
      });

      return {
        paymentSessionId,
        clientSecret,
      };
    } catch (error: any) {
      console.log('Error creating payment session:', error.message);
      throw new Error('Failed to create payment session.');
    }
  }

  async completePaymentSession(paymentSessionId: string) {
    const paymentSession = await this.db.query.paymentSessions.findFirst({
      where: (paymentSessions, { eq }) =>
        eq(paymentSessions.paymentSessionId, paymentSessionId),
    });

    if (!paymentSession) {
      console.warn('Payment session not found');
      return { success: false, reason: 'Payment session not found' };
    }

    if (['COMPLETED', 'CANCELLED'].includes(paymentSession.status)) {
      console.warn(
        `Payment session already ${paymentSession.status.toLowerCase()}`
      );
      return {
        success: false,
        reason: `Already ${paymentSession.status.toLowerCase()}`,
      };
    }

    await this.db
      .update(paymentSessions)
      .set({ status: 'COMPLETED' })
      .where(eq(paymentSessions.id, paymentSession.id));

    return { success: true };
  }

  async cancelPaymentSession(paymentSessionId: string) {
    const paymentSession = await this.db.query.paymentSessions.findFirst({
      where: (paymentSessions, { eq }) =>
        eq(paymentSessions.paymentSessionId, paymentSessionId),
    });

    if (!paymentSession) {
      console.warn('Payment session not found');
      return { success: false, reason: 'Payment session not found' };
    }

    await this.db
      .update(paymentSessions)
      .set({ status: 'CANCELLED' })
      .where(eq(paymentSessions.id, paymentSession.id));

    return { success: true };
  }
}
