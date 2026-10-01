import {
  Controller,
  Post,
  Body,
  Param,
  HttpCode,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ResponseLoginDto } from './dto/response-login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { USER_PROFILE } from 'src/core/user/enum/profile.enum';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Login of user' })
  @ApiResponse({ status: 200, type: ResponseLoginDto })
  @HttpCode(200)
  @Post('login')
  async login(@Body() signAuthDto: LoginDto) {
    return this.authService.login(signAuthDto);
  }

  @ApiOperation({ summary: 'Request reset of password' })
  @Post('forgot-password/:email')
  async forgotPassword(@Param('email') email: string) {
    const result = await this.authService.sendEmailOfRecovery(email);
    return result;
  }

  @ApiOperation({ summary: 'Reset password with base at token of reset' })
  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.password,
    );
    return { message: 'Password reset with success' };
  }

  @ApiOperation({ summary: 'Validate token of authentication' })
  @UseGuards(JwtAuthGuard)
  @Post('validate')
  async validate(@Request() req) {
    const user = req.user;
    if (user.profile === USER_PROFILE.AUTOPILOT) {
      return {
        authenticated: true,
        name: user.name,
        redirect: '/backoffice/app/dashboard',
      };
    } else if (
      user.profile === USER_PROFILE.STOREOWNER ||
      user.profile === USER_PROFILE.USER
    ) {
      return {
        authenticated: true,
        name: user.name,
        redirect: '/app/dashboard',
      };
    }

    return {
      authenticated: false,
      redirect: '/login',
    };
  }
}
