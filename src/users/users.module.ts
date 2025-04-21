import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { DatabaseModule } from '../database/database.module';
import { LoyaltyModule } from '../loyalty/loyalty.module';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  imports: [DatabaseModule, LoyaltyModule],
  exports: [UsersService],
})
export class UsersModule {}
