import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateCourtDto {
  @IsString()
  @IsNotEmpty()
  centerId: string;

  @IsInt()
  @Type(() => Number)
  courtNo: number;
}
