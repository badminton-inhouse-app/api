import { Body, Controller, Post } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingCenterDto } from './dto/booking-center.dto';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  async createBooking(@Body() body: BookingCenterDto) {
    const userId = '123'; // Replace with actual user ID from token
    return await this.bookingsService.booking(body, userId);
  }
}
