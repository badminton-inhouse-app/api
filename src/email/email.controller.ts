import { Controller, Get, Res } from '@nestjs/common';
import { EmailService } from './email.service';
import { Response } from 'express';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Get('/test-send-email')
  async testSendEmail(@Res() res: Response) {
    const userId = 'eba4ac02-e0d4-44dc-8232-3d053951a1da'; // Replace with actual user ID
    const bookingId = '352f33b0-8494-4caf-b608-e03d5e120fae'; // Replace with actual booking ID
    const result = await this.emailService.sendBookingCompletedEmail(
      userId,
      bookingId
    );
    return res.status(200).json({ data: result });
  }
}
