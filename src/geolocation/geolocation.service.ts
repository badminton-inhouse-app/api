import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { sql } from 'drizzle-orm';
import { DRIZZLE } from '../database/database.module';
import { centers } from '../database/schema';
import { DrizzleDB } from '../database/types/drizzle';
import { GetNearbyCentersQueryDto } from './dto/get-nearby-centers-query.dto';

@Injectable()
export class GeolocationService {
  constructor(
    @Inject() private readonly configService: ConfigService,
    @Inject(DRIZZLE) private readonly db: DrizzleDB
  ) {}

  async getLocationInfo(address: string, district: string, city: string) {
    const locationIQApiKey = this.configService.get<string>(
      'LOCATION_IQ_API_KEY'
    );
    if (!locationIQApiKey) {
      console.log('LOCATION_IQ_API_KEY is not defined');
      return null;
    }

    try {
      const response = await axios.get(
        `https://us1.locationiq.com/v1/search/structured`,
        {
          params: {
            key: locationIQApiKey,
            street: address,
            city,
            district,
            country: 'Vietnam',
            format: 'json',
            limit: 1,
          },
        }
      );

      const data = response.data as [
        {
          place_id: string;
          licence: string;
          osm_type: string;
          osm_id: string;
          boundingbox: [string, string, string, string];
          lat: string;
          lon: string;
          display_name: string;
          class: string;
          type: string;
          importance: number;
        },
      ];

      return {
        lat: data[0].lat,
        lon: data[0].lon,
      };
    } catch (err: any) {
      console.log('Error at getLocationInfo: ', err);
      return null;
    }
  }

  async getNearbyCenters(
    query: GetNearbyCentersQueryDto,
    radiusKm: number = 10
  ) {
    const { lat, lng, page = 1, limit = 10 } = query;
    const offset = (page - 1) * limit;

    // Calculate the distance between the user's location and the center's location using the Haversine formula
    const distanceFormula = sql`
    6371 * 2 * asin(
      sqrt(
        power(sin(radians((${lat} - ${centers.lat}) / 2)), 2) +
        cos(radians(${lat})) * cos(radians(${centers.lat})) *
        power(sin(radians((${lng} - ${centers.lng}) / 2)), 2)
      )
    )
  `;

    // Query the database to get the centers within the specified radius
    const result = await this.db
      .select({
        id: centers.id,
        lat: centers.lat,
        lng: centers.lng,
        distance: distanceFormula,
      })
      .from(centers)
      .where(sql`${distanceFormula} < ${radiusKm}`)
      .limit(limit + 1)
      .offset(offset)
      .orderBy(distanceFormula);

    return {
      items: result.slice(0, limit),
      page,
      limit,
      has_next: result.length > limit,
    };
  }
}
