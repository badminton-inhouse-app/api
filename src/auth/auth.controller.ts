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
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import LoginDto from './dto/login.dto';
import { UsersService } from 'src/users/users.service';
import { ERROR_MESSAGE } from 'src/constants';
import AccessTokenGuard from './guards/access-token.guard';
import RefreshTokenGuard from './guards/refresh-token.guard';
import { JWT_CONFIG } from '../config/jwt';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService
  ) {}

  @Post('/login')
  async login(@Body() body: LoginDto, @Res() res: Response) {
    const result = await this.authService.login(body.username, body.password);

    if (result instanceof Error) {
      if (
        result.message === ERROR_MESSAGE.INVALID_USERNAME_PASSWOR.toString()
      ) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          message: result.message,
        });
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGE.INTERNAL_SERVER_ERROR,
      });
    }

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: JWT_CONFIG.REFRESH_TOKEN_EXPIRATION,
      path: '/',
    });

    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: JWT_CONFIG.REFRESH_TOKEN_EXPIRATION,
      path: '/',
    });

    return res.status(HttpStatus.OK).json({
      message: 'Login successfully',
      status: 'success',
    });
  }

  @UseGuards(AccessTokenGuard)
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
        message: 'Authenticated successfully',
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt,
        },
        status: 'success',
      });
    } catch (err: any) {
      console.log('Error at authenticate: ' + err.message);
      throw new UnauthorizedException();
    }
  }

  @Post('/logout')
  logout(@Res() res: Response) {
    res.clearCookie('refreshToken');
    res.clearCookie('accessToken');

    return res.status(HttpStatus.OK).json({
      message: 'Logout successfully',
      status: 'success',
    });
  }

  @UseGuards(RefreshTokenGuard)
  @Post('/refresh')
  async refreshToken(@Req() request: any, @Res() res: Response) {
    const userId = request.userId;
    if (!userId) {
      throw new UnauthorizedException();
    }
    try {
      const user = await this.usersService.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      const { accessToken, refreshToken } =
        this.authService.generateJWT(userId);

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: JWT_CONFIG.REFRESH_TOKEN_EXPIRATION,
        path: '/',
      });

      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: JWT_CONFIG.REFRESH_TOKEN_EXPIRATION,
        path: '/',
      });

      return res.status(HttpStatus.OK).json({
        message: 'Refresh token successfully',
        status: 'success',
      });
    } catch (err: any) {
      console.log('Error at refreshToken: ' + err.message);
      throw new UnauthorizedException();
    }
  }
}
