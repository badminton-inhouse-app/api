import { Controller, Get, HttpStatus, Param, Res } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { Response } from 'express';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('/payment-sessions/:id')
  async findById(@Param('id') id: string, @Res() res: Response) {
    try {
      const userId = 'eba4ac02-e0d4-44dc-8232-3d053951a1da'; // Replace with actual user ID from token
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
