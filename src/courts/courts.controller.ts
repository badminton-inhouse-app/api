import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { CourtsService } from './courts.service';
import { CreateCourtDto } from './dto/create-court.dto';
@Controller('courts')
export class CourtsController {
  constructor(private readonly courtsService: CourtsService) {}

  @Post('')
  async create(@Body() body: CreateCourtDto, @Res() res: Response) {
    const court = await this.courtsService.create(body);
    if (!court) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to create court',
      });
    }
    return res.status(HttpStatus.CREATED).json({
      message: 'Court created successfully',
      court,
    });
  }
}
