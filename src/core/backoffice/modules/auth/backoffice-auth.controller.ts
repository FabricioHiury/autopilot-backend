import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/auth/guards/jwt-auth.guard';
import { USER_PROFILE } from 'src/core/user/enum/profile.enum';
import { UserId } from 'src/auth/auth/decorators/user-id-decorator';
import { Profile } from 'src/auth/auth/roles-decorators/profile/profile.decorator';
import { ProfileGuard } from 'src/auth/auth/roles-decorators/profile/profile.guard';
import { AuthService } from 'src/auth/auth/auth.service';
import { ResponseAccessBackofficeDto } from './dto/response-access-backoffice.dto';

@ApiTags('Backoffice - Auth')
@Controller('backoffice/auth')
@UseGuards(JwtAuthGuard, ProfileGuard)
export class BackofficeAuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Get permissions of user of backoffice' })
  @ApiResponse({ status: 200, type: ResponseAccessBackofficeDto })
  @Profile(USER_PROFILE.AUTOPILOT)
  @Get('access')
  async accessBackoffice(@UserId() userId: string) {
    return this.authService.getAccessBackoffice(userId);
  }
}
