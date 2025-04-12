import { BadRequestException, Controller, Post, Req } from '@nestjs/common';
import { StripeService } from './stripe.service';

@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('webhooks/stripe')
  async handleStripeWebhook(@Req() req: any) {
    if (!req.body) {
      throw new BadRequestException('Request body is missing.');
    }
    const sig = req.headers['stripe-signature'];
    await this.stripeService.handleStripeWebhook(sig, req.body);
  }
}
