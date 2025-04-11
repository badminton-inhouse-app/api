import * as dotenv from 'dotenv';

dotenv.config();

export const JWT_CONFIG = {
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
  ACCESS_TOKEN_EXPIRATION: 900000, // 15 minutes
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
  REFRESH_TOKEN_EXPIRATION: 604800000, // 7 days
};
