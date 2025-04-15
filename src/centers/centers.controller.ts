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
import { CentersService } from './centers.service';
import { CreateCenterDto } from './dto/create-center.dto';
import { Response } from 'express';
import { SearchCentersQueryDto } from './dto/search-centers-query.dto';

@Controller('centers')
export class CentersController {
  constructor(private readonly centersService: CentersService) {}

  @Get('/:id')
  async findById(@Param('id') id: string, @Res() res: Response) {
    if (!id) {
      return {
        message: 'Missing id',
        status: 'error',
      };
    }

    const result = await this.centersService.findById(id);

    if (!result) {
      return res.status(HttpStatus.NOT_FOUND).json({
        message: 'Center not found',
        status: 'error',
      });
    }

    return res.status(HttpStatus.OK).json({
      message: 'Center details fetched successfully',
      status: 'success',
      data: result,
    });
  }

  @Get('')
  async findAll(@Query() query: SearchCentersQueryDto, @Res() res: Response) {
    const result = await this.centersService.findAll(query);
    if (!result) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Error fetching centers',
        status: 'error',
      });
    }
    return res.status(HttpStatus.OK).json({
      message: 'Centers fetched successfully',
      status: 'success',
      data: result,
    });
  }

  @Post('')
  async create(@Body() body: CreateCenterDto, @Res() res: Response) {
    const result = await this.centersService.create(body);
    if (!result) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Error creating center',
      });
    }
    return res.status(HttpStatus.CREATED).json({
      message: 'Center created successfully',
      data: result,
    });
  }
}
