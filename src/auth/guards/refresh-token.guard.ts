import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jsonwebtoken from 'jsonwebtoken';

@Injectable()
export default class RefreshTokenGuard implements CanActivate {
  constructor(@Inject() private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext) {
    const request: any = context.switchToHttp().getRequest();
    const refreshToken = request.cookies.refreshToken;
    if (!refreshToken) {
      console.log('Refresh token is not provided.');
      throw new UnauthorizedException();
    }

    const refreshTokenSecret = this.configService.get<string>(
      'REFRESH_TOKEN_SECRET'
    );
    if (!refreshTokenSecret) {
      console.log(
        'REFRESH_TOKEN_SECRET is not defined in environment variables.'
      );
      throw new UnauthorizedException();
    }

    try {
      const decoded = jsonwebtoken.verify(refreshToken, refreshTokenSecret);
      request.userId = decoded['userId'];
      return true;
    } catch (err: any) {
      console.log('Error verifying refresh token: ' + err.message);
      request.userId = null;
      throw new UnauthorizedException();
    }
  }
}
