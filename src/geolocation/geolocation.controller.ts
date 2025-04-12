import { Controller, Get, HttpStatus, Query, Res } from '@nestjs/common';
import { GeolocationService } from './geolocation.service';
import { Response } from 'express';
import { GetNearbyCentersQueryDto } from './dto/get-nearby-centers-query.dto';

@Controller('geolocation')
export class GeolocationController {
  constructor(private readonly geolocationService: GeolocationService) {}

  @Get('/nearby')
  async getNearbyCenters(
    @Query() query: GetNearbyCentersQueryDto,
    @Res() res: Response
  ) {
    const result = await this.geolocationService.getNearbyCenters(query);

    if (!result) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Error fetching nearby centers',
        status: 'error',
      });
    }

    return res.status(HttpStatus.OK).json({
      message: 'Nearby centers fetched successfully',
      status: 'success',
      data: result,
    });
  }
}
