import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from 'src/database/database.module';
import { DrizzleDB } from '../database/types/drizzle';
import { CreateCourtDto } from './dto/create-court.dto';
import { courts } from 'src/database/schema';

@Injectable()
export class CourtsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async create(createCourtDto: CreateCourtDto) {
    try {
      return await this.db.insert(courts).values(createCourtDto).returning();
    } catch (err: any) {
      console.log('Error at create court: ', err.message);
      return null;
    }
  }
}
