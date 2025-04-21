// dto/query-items.dto.ts

import { IsOptional, IsNumber, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class GetUserBookingsQueryDto {
  @IsDateString()
  @IsOptional()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;
}
