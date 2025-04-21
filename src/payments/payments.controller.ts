import {
  Controller,
  Get,
  HttpStatus,
  Param,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { Response } from 'express';
import AccessTokenGuard from 'src/auth/guards/access-token.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(AccessTokenGuard)
  @Get('/payment-sessions/:id')
  async findById(
    @Param('id') id: string,
    @Req() req: any,
    @Res() res: Response
  ) {
    try {
      const userId = req.userId;
      const result = await this.paymentsService.findById(id);

      if (userId !== result.userId) {
        return res.status(HttpStatus.FORBIDDEN).json({
          message: 'You are not authorized to view this payment session',
          status: 'error',
        });
      }

      return res.status(HttpStatus.OK).json({
        message: 'Payment session fetched successfully',
        status: 'success',
        data: result,
      });
    } catch (err: any) {
      return res.status(HttpStatus.CONFLICT).json({
        message: err.message,
        status: 'error',
      });
    }
  }
}
