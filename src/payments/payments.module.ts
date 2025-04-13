import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { StripeModule } from '../stripe/stripe.module';
import { DatabaseModule } from '../database/database.module';
import { PaymentEventsListener } from './listeners/payment-events.listener';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentEventsListener],
  imports: [DatabaseModule, StripeModule],
  exports: [PaymentsService],
})
export class PaymentsModule {}
