import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { StripeModule } from '../stripe/stripe.module';
import { DatabaseModule } from '../database/database.module';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService],
  imports: [DatabaseModule, StripeModule],
})
export class PaymentsModule {}
