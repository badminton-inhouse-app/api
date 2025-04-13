import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingCenterDto } from './dto/booking-center.dto';
import { Response } from 'express';
import { CreateBookingPaymentSessionDto } from './dto/create-booking-payment-session.dto';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  async createBooking(@Body() body: BookingCenterDto, @Res() res: Response) {
    try {
      const userId = 'eba4ac02-e0d4-44dc-8232-3d053951a1da'; // Replace with actual user ID from token
      const result = await this.bookingsService.booking(body, userId);

      if (result && result.length === 0) {
        return res.status(HttpStatus.CONFLICT).json({
          message:
            'All courts with the given time and date are already booked.',
          status: 'error',
        });
      }

      return res.status(HttpStatus.CREATED).json({
        message: 'Booking created successfully',
        data: result,
        status: 'success',
      });
    } catch (err: any) {
      return res.status(500).json({ message: err.message, status: 'error' });
    }
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

  @Post('/:bookingId/pay')
  async createBookingPaymentSession(
    @Param('bookingId') bookingId: string,
    @Body() body: CreateBookingPaymentSessionDto,
    @Res() res: Response
  ) {
    const userId = 'eba4ac02-e0d4-44dc-8232-3d053951a1da'; // Replace with actual user ID from token
    try {
      const result = await this.bookingsService.createBookingPaymentSession(
        userId,
        bookingId,
        body
      );
      return res.status(HttpStatus.CREATED).json({
        message: 'Payment session created successfully',
        data: result,
        status: 'success',
      });
    } catch (err: any) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: err.message, status: 'error' });
    }
  }
}
