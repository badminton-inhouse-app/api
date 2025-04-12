import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { EmailModule } from './email/email.module';
import { RedisModule } from './redis/redis.module';
import { CacheModule } from '@nestjs/cache-manager';
import { createKeyv, Keyv } from '@keyv/redis';
import { CacheableMemory } from 'cacheable';
import { CourtsModule } from './courts/courts.module';
import { CentersModule } from './centers/centers.module';
import { QueueModule } from './queue/queue.module';
import { BookingsModule } from './bookings/bookings.module';
import { AuthModule } from './auth/auth.module';
import { LoyaltyModule } from './loyalty/loyalty.module';
import { VoucherModule } from './voucher/voucher.module';
import { RewardsModule } from './rewards/rewards.module';
import { PaymentsModule } from './payments/payments.module';
import { StripeModule } from './stripe/stripe.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: () => {
        return {
          stores: [
            new Keyv({
              store: new CacheableMemory({ ttl: 60000, lruSize: 5000 }),
            }),
            createKeyv('redis://localhost:6379'),
          ],
        };
      },
    }),
    DatabaseModule,
    UsersModule,
    EmailModule,
    RedisModule,
    CourtsModule,
    CentersModule,
    QueueModule,
    BookingsModule,
    AuthModule,
    LoyaltyModule,
    VoucherModule,
    RewardsModule,
    PaymentsModule,
    StripeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
