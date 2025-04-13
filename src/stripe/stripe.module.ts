import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../database/database.module';
@Module({
  controllers: [StripeController],
  providers: [StripeService],
  exports: [StripeService],
  imports: [ConfigModule, DatabaseModule],
})
export class StripeModule {}
