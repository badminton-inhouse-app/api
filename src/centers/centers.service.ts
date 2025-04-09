import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from '../database/database.module';
import { DrizzleDB } from '../database/types/drizzle';
@Injectable()
export class CentersService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}
}
