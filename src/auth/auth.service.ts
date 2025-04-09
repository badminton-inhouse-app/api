import { Inject, Injectable } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import * as bcryptjs from 'bcryptjs';
import { DRIZZLE } from '../database/database.module';
import { DrizzleDB } from '../database/types/drizzle';
import { ERROR_MESSAGE } from '../constants';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    @Inject() private readonly configService: ConfigService
  ) {}

  generateJWT(userId: string) {
    const rfTokenSecret = this.configService.get<string>(
      'REFRESH_TOKEN_SECRET'
    );
    if (!rfTokenSecret) {
      throw new Error(ERROR_MESSAGE.INTERNAL_SERVER_ERROR);
    }

    const accessTokenSecret = this.configService.get<string>(
      'ACCESS_TOKEN_SECRET'
    );
    if (!accessTokenSecret) {
      throw new Error(ERROR_MESSAGE.INTERNAL_SERVER_ERROR);
    }

    const refreshToken = jwt.sign({ userId }, rfTokenSecret, {
      expiresIn: '7d',
    });
    const accessToken = jwt.sign({ userId }, accessTokenSecret, {
      expiresIn: '15m',
    });

    return {
      refreshToken,
      accessToken,
    };
  }

  async login(username: string, password: string) {
    try {
      const user = await this.db.query.users.findFirst({
        where: (users, { eq }) => eq(users.username, username),
      });

      if (!user) {
        throw new Error(ERROR_MESSAGE.INVALID_USERNAME_PASSWOR);
      }

      const isValidPassword = await bcryptjs.compare(password, user.password);
      if (!isValidPassword) {
        throw new Error(ERROR_MESSAGE.INVALID_USERNAME_PASSWOR);
      }

      const token = this.generateJWT(user.id);
      return token;
    } catch (error: any) {
      console.log('Error at login: ' + error.message);
      throw new Error(ERROR_MESSAGE.INTERNAL_SERVER_ERROR);
    }
  }
}
