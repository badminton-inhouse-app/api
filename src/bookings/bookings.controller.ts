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

  @Get('/:id')
  async findById(@Param('id') id: string, @Res() res: Response) {
    try {
      const userId = 'eba4ac02-e0d4-44dc-8232-3d053951a1da'; // Replace with actual user ID from token
      const result = await this.bookingsService.findById(id);

      if (!result) {
        return res.status(HttpStatus.NOT_FOUND).json({
          message: 'Booking not found',
          status: 'error',
        });
      }

      if (result.userId !== userId) {
        return res.status(HttpStatus.FORBIDDEN).json({
          message: 'You are not authorized to view this booking',
          status: 'error',
        });
      }

      return res.status(HttpStatus.OK).json({
        message: 'Booking info fetched successfully',
        data: result,
        status: 'success',
      });
    } catch (err: any) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: err.message, status: 'error' });
    }
  }

  @Get('')
  async getUserBookings(@Res() res: Response) {
    const userId = 'eba4ac02-e0d4-44dc-8232-3d053951a1da'; // Replace with actual user ID from token
    const result = await this.bookingsService.getUserBookings(userId);
    return res.status(HttpStatus.OK).json({
      message: `User's bookings fetched successfully`,
      data: result,
      status: 'success',
    });
  }

  @Post()
  async createBooking(@Body() body: BookingCenterDto, @Res() res: Response) {
    try {
      const userId = 'eba4ac02-e0d4-44dc-8232-3d053951a1da'; // Replace with actual user ID from token
      const result = await this.bookingsService.booking(body, userId);

      return res.status(HttpStatus.CREATED).json({
        message: 'Booking created successfully',
        data: result,
        status: 'success',
      });
    } catch (err: any) {
      return res.status(500).json({ message: err.message, status: 'error' });
    }
  }

  @Get('/:bookingId/payment-session')
  async getBookingPaymentSession(
    @Param('bookingId') bookingId: string,
    @Res() res: Response
  ) {
    const userId = 'eba4ac02-e0d4-44dc-8232-3d053951a1da'; // Replace with actual user ID from token
    try {
      const result = await this.bookingsService.getBookingPaymentSession(
        userId,
        bookingId
      );

      if (!result) {
        return res.status(HttpStatus.NOT_FOUND).json({
          message: 'Payment session not found',
          status: 'error',
        });
      }

      if (result.userId !== userId) {
        return res.status(HttpStatus.FORBIDDEN).json({
          message: 'You are not authorized to view this payment session',
          status: 'error',
        });
      }

      return res.status(HttpStatus.OK).json({
        message: 'Payment session fetched successfully',
        data: result,
        status: 'success',
      });
    } catch (err: any) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: err.message, status: 'error' });
    }
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

  @Get('/verify')
  async verifyPayment(
    @Query('sig') sig: string,
    @Query('bookingId') bookingId: string,
    @Query('userId') userId: string,
    @Res() res: Response
  ) {
    if (!sig || !bookingId || !userId) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Missing required parameters',
        status: 'error',
      });
    }
    const result = await this.bookingsService.verifyBookingBySig(
      userId,
      bookingId,
      sig
    );

    if (!result) {
      return res.status(HttpStatus.NOT_FOUND).json({
        message: 'Cannot verify booking',
        status: 'error',
      });
    }

    return res.status(HttpStatus.OK).json({
      message: 'Booking verified',
      data: result,
      status: 'success',
    });
  }
}
