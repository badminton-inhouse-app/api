import { Body, Controller, Get, Param, Post, Res } from '@nestjs/common';
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
  async getUserByUsername(@Param('username') username: string) {
    return this.usersService.getUserByUsername(username);
  }

  @Post('/register')
  async registerUser(@Body() registerDto: RegisterDto, @Res() res: Response) {
    const response = await this.usersService.createUser(registerDto);
    if (response.status === 'error') {
      return res.status(500).json({
        status: response.status,
        error: response.error,
      });
    }
    return res.status(201).json({
      status: response.status,
      message: 'User created successfully',
    });
  }

  @Post('/login')
  async login(@Body() registerDto: RegisterDto, @Res() res: Response) {
    const response = await this.usersService.login(registerDto);
    if (response.status === 'error') {
      return res.status(500).json({
        status: response.status,
        error: response.error,
      });
    }
    return res.status(200).json({
      status: response.status,
      message: 'User logged in successfully',
      user: response.user,
    });
  }
}
