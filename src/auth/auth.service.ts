import { Inject, Injectable } from '@nestjs/common';
import * as jsonwebtoken from 'jsonwebtoken';
import * as bcryptjs from 'bcryptjs';
import { DRIZZLE } from '../database/database.module';
import { DrizzleDB } from '../database/types/drizzle';
import { ERROR_MESSAGE } from '../constants';
import { JWT_CONFIG } from '../config/jwt';

@Injectable()
export class AuthService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  generateJWT(userId: string) {
    const rfTokenSecret = JWT_CONFIG.REFRESH_TOKEN_SECRET;
    if (!rfTokenSecret) {
      console.log(
        'REFRESH_TOKEN_SECRET is not defined in environment variables.'
      );
      throw new Error(ERROR_MESSAGE.INTERNAL_SERVER_ERROR);
    }

    const accessTokenSecret = JWT_CONFIG.ACCESS_TOKEN_SECRET;
    if (!accessTokenSecret) {
      console.log(
        'ACCESS_TOKEN_SECRET is not defined in environment variables.'
      );
      throw new Error(ERROR_MESSAGE.INTERNAL_SERVER_ERROR);
    }

    try {
      const refreshToken = jsonwebtoken.sign({ userId }, rfTokenSecret, {
        expiresIn: JWT_CONFIG.REFRESH_TOKEN_EXPIRATION / 1000,
      });
      const accessToken = jsonwebtoken.sign({ userId }, accessTokenSecret, {
        expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRATION / 1000,
      });

      return {
        refreshToken,
        accessToken,
      };
    } catch (error: any) {
      console.log('Error generating JWT: ' + error.message);
      throw new Error(ERROR_MESSAGE.INTERNAL_SERVER_ERROR);
    }
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
