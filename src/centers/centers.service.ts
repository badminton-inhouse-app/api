import { Inject, Injectable } from '@nestjs/common';
import { SearchCentersQueryDto } from './dto/search-centers-query.dto';
import { and, eq, ilike, SQL } from 'drizzle-orm';
import { GeolocationService } from '../geolocation/geolocation.service';
import { DRIZZLE } from '../database/database.module';
import { DrizzleDB } from '../database/types/drizzle';
import { CreateCenterDto } from './dto/create-center.dto';
import { centers } from '../database/schema';
@Injectable()
export class CentersService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly geolocationService: GeolocationService
  ) {}

  async findById(id: string) {
    try {
      const details = await this.db.query.centers.findFirst({
        where: eq(centers.id, id),
      });

      if (!details) {
        return null;
      }

      const courts = await this.db.query.courts.findMany({
        where: (courts, { eq }) => eq(courts.centerId, id),
      });

      const courtIds = courts.map((court) => court.id);

      const bookings = await this.db.query.bookings.findMany({
        where: (bookings, { inArray, and, ne }) =>
          and(
            inArray(bookings.courtId, courtIds),
            ne(bookings.status, 'CANCELLED')
          ),
      });

      return {
        details,
        bookings,
        courts,
      };
    } catch (err: any) {
      console.log('Error at findAll centers: ', err);
      return null;
    }
  }

  async findAll(query: SearchCentersQueryDto) {
    try {
      const { address, district, limit = 10, page = 1 } = query;
      const offset = (page - 1) * limit;

      const where: SQL[] = [];

      if (address) {
        where.push(ilike(centers.address, `%${address}%`));
      }

      if (district) {
        where.push(eq(centers.district, district));
      }

      const result = await this.db
        .select()
        .from(centers)
        .where(where.length ? and(...where) : undefined)
        .limit(limit + 1)
        .offset(offset);

      return {
        items: result.slice(0, limit),
        page,
        limit,
        has_next: result.length > limit,
      };
    } catch (err: any) {
      console.log('Error at findAll centers: ', err);
      return null;
    }
  }

  async create(createCenterDto: CreateCenterDto) {
    try {
      const { address, city, district } = createCenterDto;
      const result = await this.geolocationService.getLocationInfo(
        address,
        district,
        city
      );
      return await this.db
        .insert(centers)
        .values({
          ...createCenterDto,
          lat: result?.lat ?? '0',
          lng: result?.lon ?? '0',
        })
        .returning();
    } catch (err: any) {
      console.log('Error at create center: ', err);
      return null;
    }
  }
}
