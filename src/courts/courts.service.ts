import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from 'src/database/database.module';
import { DrizzleDB } from '../database/types/drizzle';

@Injectable()
export class CourtsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}
}
