import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common';
import { VoucherService } from './voucher.service';
import CreateVoucherDto from './dto/create-voucher.dto';
import { Response } from 'express';

@Controller('vouchers')
export class VoucherController {
  constructor(private readonly voucherService: VoucherService) {}

  @Post()
  async createVoucher(@Body() body: CreateVoucherDto, @Res() res: Response) {
    const result = await this.voucherService.create(body);

    if (!result) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Error creating voucher' });
    }

    if (result) {
      return res.status(HttpStatus.CREATED).json({
        message: 'Voucher created successfully',
        data: result,
        success: true,
      });
    }
  }
}
