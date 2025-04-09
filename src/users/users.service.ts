import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import * as bcryptjs from 'bcryptjs';
import { DRIZZLE } from '../database/database.module';
import { DrizzleDB } from '../database/types/drizzle';
import { users } from '../database/schema';
import { RegisterDto } from './dto/register.dto';
import { eq } from 'drizzle-orm';

@Injectable()
export class UsersService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async getUsers() {
    const user = await this.db.select().from(users);
    return user;
  }

  async findByUsername(username: string) {
    const result = await this.db.query.users.findFirst({
      where: eq(users.username, username),
    });
    return result;
  }

  async findById(id: string) {
    const result = await this.db.query.users.findFirst({
      where: eq(users.id, id),
    });
    return result;
  }

  async createUser(registerDto: RegisterDto): Promise<{
    status: 'success' | 'error';
    statusCode: number;
    error: string | null;
  }> {
    try {
      const { password, username } = registerDto;
      const hashedPassword = await bcryptjs.hash(password, 10);
      await this.db.insert(users).values({
        username,
        password: hashedPassword,
      });
      return {
        status: 'success',
        statusCode: 201,
        error: null,
      };
    } catch (err: any) {
      console.error('Error creating user:', err.message);
      if (err.message.includes('users_username_unique')) {
        return {
          status: 'error',
          statusCode: HttpStatus.CONFLICT,
          error: 'Username already exists',
        };
      }
      return {
        status: 'error',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'An unexpected error occurred. Please try again later.',
      };
    }
  }
}
