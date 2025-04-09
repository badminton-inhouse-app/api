import {
  Controller,
  Post,
  Body,
  Res,
  Get,
  Req,
  UnauthorizedException,
  NotFoundException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import LoginDto from './dto/login.dto';
import { UsersService } from 'src/users/users.service';
import { ERROR_MESSAGE } from 'src/constants';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService
  ) {}

  @Post('/login')
  async login(@Body() body: LoginDto, @Res() res: Response) {
    try {
      const result = await this.authService.login(body.username, body.password);

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
      });

      res.cookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
      });

      return res.status(HttpStatus.OK).json({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    } catch (err: any) {
      if (err.message === ERROR_MESSAGE.INVALID_USERNAME_PASSWOR) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          message: ERROR_MESSAGE.INVALID_USERNAME_PASSWOR,
        });
      }
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGE.INTERNAL_SERVER_ERROR,
      });
    }
  }

  @Get('/me')
  async authenticate(@Req() request: any, @Res() res: Response) {
    const userId = request.userId;
    if (!userId) {
      throw new UnauthorizedException();
    }
    try {
      const user = await this.usersService.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return res.status(HttpStatus.OK).json({
        id: user.id,
        username: user.username,
        email: user.email,
      });
    } catch (err: any) {
      console.log('Error at authenticate: ' + err.message);
      throw new UnauthorizedException();
    }
  }
}
