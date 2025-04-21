import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingCenterDto } from './dto/booking-center.dto';
import { Response } from 'express';
import { CreateBookingPaymentSessionDto } from './dto/create-booking-payment-session.dto';
import AccessTokenGuard from 'src/auth/guards/access-token.guard';
import { GetUserBookingsQueryDto } from './dto/get-user-bookings-query.dto';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @UseGuards(AccessTokenGuard)
  @Get('/:id')
  async findById(
    @Param('id') id: string,
    @Req() req: any,
    @Res() res: Response
  ) {
    try {
      const userId = req.userId;
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

  @UseGuards(AccessTokenGuard)
  @Get('')
  async getUserBookings(
    @Query() query: GetUserBookingsQueryDto,
    @Req() req: any,
    @Res() res: Response
  ) {
    const userId = req.userId;
    const result = await this.bookingsService.getUserBookings(userId, query);
    return res.status(HttpStatus.OK).json({
      message: `User's bookings fetched successfully`,
      data: result,
      status: 'success',
    });
  }

  @UseGuards(AccessTokenGuard)
  @Post()
  async createBooking(
    @Body() body: BookingCenterDto,
    @Req() req: any,
    @Res() res: Response
  ) {
    try {
      const userId = req.userId;
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

  @UseGuards(AccessTokenGuard)
  @Get('/:bookingId/payment-session')
  async getBookingPaymentSession(
    @Param('bookingId') bookingId: string,
    @Req() req: any,
    @Res() res: Response
  ) {
    const userId = req.userId;
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

  @UseGuards(AccessTokenGuard)
  @Post('/:bookingId/pay')
  async createBookingPaymentSession(
    @Param('bookingId') bookingId: string,
    @Body() body: CreateBookingPaymentSessionDto,
    @Req() req: any,
    @Res() res: Response
  ) {
    const userId = req.userId;
    console.log(userId);
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
