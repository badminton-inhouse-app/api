import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingCenterDto } from './dto/booking-center.dto';
import { Response } from 'express';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  async createBooking(@Body() body: BookingCenterDto) {
    const userId = '123'; // Replace with actual user ID from token
    return await this.bookingsService.booking(body, userId);
  }

  @Get('/:bookingId/qrcode')
  async generateQRCode(
    @Param('bookingId') bookingId: string,
    @Res() res: Response,
    @Query('action') action: 'view' | 'download'
  ) {
    const userId = '123'; // Replace with actual user ID from token
    const qrCode = await this.bookingsService.genQRCode(bookingId, userId);
    if (!qrCode) return res.status(404).send('No booking found');
    res.setHeader('Content-Type', 'image/svg+xml');
    if (action && action === 'download') {
      console.log(123);
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="my-image.svg"'
      );
    }
    res.send(qrCode);
  }
}
