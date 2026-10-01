import {
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AvatarExternalService } from './avatar-external.service';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/auth/roles-decorators/permissions/permissions.guard';
import { ENUM_TYPE_AVATAR_EXTERNAL } from './enum/type-avatar-external.enum';
import { Response } from 'express';
import { StoreId } from 'src/auth/auth/decorators/store-id-decorator';

@ApiTags('Avatar External')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('avatar-external')
export class AvatarExternalController {
  constructor(private readonly avatarExternalService: AvatarExternalService) {}

  @Get('/:type/:id')
  async getAvatar(
    @StoreId() storeId: string,
    @Param('type', new ParseEnumPipe(ENUM_TYPE_AVATAR_EXTERNAL))
    type: ENUM_TYPE_AVATAR_EXTERNAL,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const url = await this.avatarExternalService.getUrlAvatar({
      storeId,
      type,
      id,
    });

    if (url) {
      res.redirect(url);
      return;
    }
  }
}
