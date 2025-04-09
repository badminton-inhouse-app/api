import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { UsersService } from './users.service';
import { RegisterDto } from './dto/register.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getAllUsers() {
    return this.usersService.getUsers();
  }

  @Get('/:username')
  async findByUsername(@Param('username') username: string) {
    return this.usersService.findByUsername(username);
  }

  @Post('/register')
  async registerUser(@Body() registerDto: RegisterDto, @Res() res: Response) {
    const response = await this.usersService.createUser(registerDto);

    if (response.status === 'error') {
      return res.status(response.statusCode).json({
        status: response.status,
        error: response.error,
      });
    }

    return res.status(HttpStatus.CREATED).json({
      status: response.status,
      message: 'User created successfully',
    });
  }
}
