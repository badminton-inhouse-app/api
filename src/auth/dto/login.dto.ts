import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export default class LoginDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[^\s*]+$/, {
    message: 'Username cannot contain spaces or wildcards.',
  })
  @Length(4, 20, { message: 'Username must be between 4 and 20 characters.' })
  username: string;

  @IsString()
  @IsNotEmpty()
  @Length(4, 20, { message: 'Password must be longer than 4 characters.' })
  password: string;
}
