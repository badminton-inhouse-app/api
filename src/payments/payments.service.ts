import { PaymentMethod } from './../constants/enums';
import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from '../database/database.module';
import { DrizzleDB } from '../database/types/drizzle';
import { StripeService } from '../stripe/stripe.service';

@Injectable()
export class PaymentsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly stripeService: StripeService
  ) {}

  async createSession(
    bookingId: string,
    amount: number,
    currency: string = 'vnd',
    paymentMethod: PaymentMethod
  ) {
    if (currency !== 'vnd') {
      throw new Error('Unsupported currency. Only VND is supported.');
    }

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
      case PaymentMethod.STRIPE:
        await this.stripeService.createSession(bookingId, amount, currency);
        break;
      default:
        throw new Error('Unsupported payment method.');
    }
  }
}
