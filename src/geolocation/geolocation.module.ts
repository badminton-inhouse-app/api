import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GeolocationService } from './geolocation.service';
import { DatabaseModule } from '../database/database.module';
import { GeolocationController } from './geolocation.controller';

@Global()
@Module({
  controllers: [GeolocationController],
  providers: [GeolocationService],
  imports: [ConfigModule, DatabaseModule],
  exports: [GeolocationService],
})
export class GeolocationModule {}
