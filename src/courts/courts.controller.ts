import { Controller } from '@nestjs/common';
import { CourtsService } from './courts.service';
@Controller('courts')
export class CourtsController {
  constructor(private readonly courtsService: CourtsService) {}
}
