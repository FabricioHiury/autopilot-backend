import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AvatarService } from './avatar.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/auth/guards/jwt-auth.guard';
import { ProfileGuard } from 'src/auth/auth/roles-decorators/profile/profile.guard';
import { Profile } from 'src/auth/auth/roles-decorators/profile/profile.decorator';
import { USER_PROFILE } from '../../enum/profile.enum';
import { Response } from 'express';
import {
  DeleteAvatarDoc,
  GetAvatarDoc,
  SaveAvatarDoc,
} from './docs/avatar.swagger';

@ApiTags('Avatar')
@Controller('avatar')
export class AvatarController {
  constructor(private readonly avatarService: AvatarService) {}

  @SaveAvatarDoc()
  @UseGuards(JwtAuthGuard, ProfileGuard)
  @Profile(USER_PROFILE.AUTOPILOT, USER_PROFILE.STOREOWNER, USER_PROFILE.USER)
  @UseInterceptors(FileInterceptor('file'))
  @Post('user/:userId')
  async saveAvatar(
    @Param('userId') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return await this.avatarService.saveAvatar(userId, file);
  }

  @DeleteAvatarDoc()
  @UseGuards(JwtAuthGuard, ProfileGuard)
  @Profile(USER_PROFILE.AUTOPILOT, USER_PROFILE.STOREOWNER, USER_PROFILE.USER)
  @Delete('user/:userId')
  async deleteAvatar(@Param('userId') userId: string) {
    await this.avatarService.deleteAvatar(userId);
  }

  @GetAvatarDoc()
  @Get('user/:userId')
  async getAvatar(@Param('userId') userId: string, @Res() res: Response) {
    const url = await this.avatarService.getAvatarUrl(userId);

    if (url) {
      res.redirect(url);
      return;
    }
    res.status(204).end();
  }
}
