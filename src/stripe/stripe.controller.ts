import {
  BadRequestException,
  Controller,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { StripeService } from './stripe.service';
import { Response, Request } from 'express';

@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('/webhook')
  async handleStripeWebhook(@Req() req: Request) {
    console.log('Received webhook request');
    if (!req.body) {
      throw new BadRequestException('Request body is missing.');
    }
    const sig = req.headers['stripe-signature'] as string;
    if (!sig) {
      throw new BadRequestException('Stripe signature is missing.');
    }
    console.log('Received webhook:', req.body);
    await this.stripeService.handleWebhook(sig, req.body);
  }

  @Post('/create-session')
  async createSession(@Req() req: any, @Res() res: Response) {
    const bookingId = req.body.bookingId;
    const amount = req.body.amount;
    const currency = req.body.currency;
    console.log(req.body);
    const session = await this.stripeService.createSession(
      bookingId,
      amount,
      currency
    );
    if (!session) {
      throw new BadRequestException('Failed to create session');
    }
    return res.status(HttpStatus.CREATED).json(session);
  }
}
