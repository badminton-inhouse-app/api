import { Inject, Injectable } from '@nestjs/common';
import { SearchCentersQueryDto } from './dto/search-centers-query.dto';
import { and, count, eq, ilike, SQL } from 'drizzle-orm';
import { GeolocationService } from '../geolocation/geolocation.service';
import { DRIZZLE } from '../database/database.module';
import { DrizzleDB } from '../database/types/drizzle';
import { CreateCenterDto } from './dto/create-center.dto';
import { centers } from '../database/schema';
import { BookingStatus } from 'src/constants/enums';
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

      return {
        details,
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

  async getSearchCentersFiltersValues(filterName: string) {
    if (!filterName) {
      const districts = await this.db
        .select({
          value: centers.district,
          total_items: count(centers.district),
        })
        .from(centers)
        .groupBy(centers.district);

      const cities = await this.db
        .select({
          value: centers.city,
          total_items: count(centers.city),
        })
        .from(centers)
        .groupBy(centers.city);

      return {
        district: {
          label: 'Quận',
          values: [...districts],
        },
        city: {
          label: 'Thành phố',
          values: [...cities],
        },
      };
    }

    if (filterName === 'district') {
      const districts = await this.db
        .select({
          value: centers.district,
          total_items: count(centers.district),
        })
        .from(centers)
        .groupBy(centers.district);
      return {
        district: {
          label: 'Quận/Huyện',
          values: [...districts],
        },
      };
    }

    if (filterName === 'city') {
      const cities = await this.db
        .select({
          value: centers.city,
          total_items: count(centers.city),
        })
        .from(centers)
        .groupBy(centers.city);
      return {
        city: {
          label: 'Thành phố/Tỉnh',
          values: [...cities],
        },
      };
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

  async getCenterBookings(id: string, status?: BookingStatus[]) {
    try {
      let statuses: BookingStatus[] = [];
      if (!status) {
        statuses = [
          BookingStatus.PENDING,
          BookingStatus.COMPLETED,
          BookingStatus.CANCELLED,
        ];
      } else {
        statuses = Array.isArray(status) ? status : [status];
      }
      const centerCourts = await this.db.query.courts.findMany({
        where: (courts, { eq }) => eq(courts.centerId, id),
      });

      if (centerCourts.length === 0) {
        return [];
      }

      const bookings = await this.db.query.bookings.findMany({
        where: (bookings, { and, inArray }) =>
          and(
            inArray(
              bookings.courtId,
              centerCourts.map((court) => court.id)
            ),
            inArray(bookings.status, statuses)
          ),
      });

      return bookings;
    } catch (err: any) {
      console.log('Error at get center bookings: ', err);
      return null;
    }
  }
}
