import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class BookingCourtDto {
  @IsString()
  @IsNotEmpty()
  courtId: string;

  @IsNumber()
  @Type(() => Number)
  startTime: number;
}
