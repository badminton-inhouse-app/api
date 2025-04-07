import { Body, Controller, Post, Res } from '@nestjs/common';
import { CourtsService } from './courts.service';
import { Response } from 'express';
import { BookingCourtDto } from './dtos/booking-court.dto';

@Controller('courts')
export class CourtsController {
  constructor(private readonly courtsService: CourtsService) {}

  @Post('/booking')
  async bookingCourt(@Body() body: BookingCourtDto, @Res() res: Response) {
    try {
      const userId = 'user1'; // Replace with actual user ID from accessToken;
      const response = await this.courtsService.bookingCourt(body, userId);
      return res.status(201).json(response);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
}
