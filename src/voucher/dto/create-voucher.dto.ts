import { Type } from 'class-transformer';
import {
  IsDecimal,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';

export default class CreateVoucherDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  desc: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsInt()
  @Type(() => Number)
  requiredPoints: number;

  @IsString()
  @IsNotEmpty()
  discountType: string;

  @IsDecimal()
  @IsNotEmpty()
  discountValue: string;

  @IsNumber()
  @Type(() => Number)
  validFrom: number;

  @IsNumber()
  @Type(() => Number)
  validTo: number;
}
