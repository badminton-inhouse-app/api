// dto/query-items.dto.ts

import { IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetNearbyCentersQueryDto {
  @IsNumber()
  @Type(() => Number)
  lat: string;

  @IsNumber()
  @Type(() => Number)
  lng: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;
}
