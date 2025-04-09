import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import jsonwebtoken from 'jsonwebtoken';

@Injectable()
export default class AuthGuard implements CanActivate {
  constructor(@Inject() private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    const accessToken = request.cookies.accessToken;
    if (!accessToken) {
      console.log('Access token is not provided.');
      throw new UnauthorizedException();
    }

    const accessTokenSecret = this.configService.get<string>(
      'ACCESS_TOKEN_SECRET'
    );
    if (!accessTokenSecret) {
      console.log(
        'ACCESS_TOKEN_SECRET is not defined in environment variables.'
      );
      throw new UnauthorizedException();
    }

    try {
      const decoded = jsonwebtoken.verify(accessToken, accessTokenSecret);
      request.userId = decoded['userId'];
      return true;
    } catch (err: any) {
      console.log('Error verifying access token: ' + err.message);
      request.userId = null;
      throw new UnauthorizedException();
    }
  }
}
