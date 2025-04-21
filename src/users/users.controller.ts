import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { UsersService } from './users.service';
import { RegisterDto } from './dto/register.dto';
import AccessTokenGuard from '../auth/guards/access-token.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getAllUsers() {
    return this.usersService.getUsers();
  }

  @UseGuards(AccessTokenGuard)
  @Get('/rewards')
  async getUserRewards(@Req() req: any, @Res() res: Response) {
    const userId = req.userId;
    const result = await this.usersService.getUserRewards(userId);

    if (!result) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        error: 'Failed to fetch user rewards',
      });
    }

    return res.status(HttpStatus.OK).json({
      status: 'success',
      data: result,
      message: 'User rewards fetched successfully',
    });
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
