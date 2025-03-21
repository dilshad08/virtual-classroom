import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/auth.guard';
import { CreateUserDto } from './dto/createUser.dto';
import { User } from '@prisma/client';
import { CustomeRequest } from 'src/interfaces/CustomeRequest';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(
      createUserDto.email,
      createUserDto.password,
      createUserDto.name,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    const user: User = await this.authService.validateUser(
      body.email,
      body.password,
    );
    return this.authService.login(user);
  }

  @HttpCode(HttpStatus.OK)
  @Post('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req: CustomeRequest) {
    return req.user;
  }
}
