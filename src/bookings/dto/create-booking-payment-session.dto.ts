import { IsString, IsNotEmpty } from 'class-validator';
import { PaymentMethod } from '../../constants/enums';

export class CreateBookingPaymentSessionDto {
  @IsString()
  @IsNotEmpty()
  paymentMethod: PaymentMethod;
}
