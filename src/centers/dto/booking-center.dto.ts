import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class BookingCenterDto {
  @IsString()
  @IsNotEmpty()
  centerId: string;

  @IsNumber()
  @Type(() => Number)
  startTime: number;

  @IsNumber()
  @Type(() => Number)
  endTime: number;
}
