import { Transform, Type } from 'class-transformer';
import { IsArray, IsEnum, IsOptional } from 'class-validator';
import { BookingStatus } from '../../constants/enums';

export default class GetCenterBookingsQueryDto {
  @IsOptional()
  @IsArray()
  @IsEnum(BookingStatus, { each: true })
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return [value];
    return [];
  })
  @Type(() => String)
  status?: BookingStatus[];
}
