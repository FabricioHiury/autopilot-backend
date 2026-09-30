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
import { PerfilGuard } from 'src/auth/auth/roles-decorators/perfil/perfil.guard';
import { Perfil } from 'src/auth/auth/roles-decorators/perfil/perfil.decorator';
import { USUARIO_PERFIL } from '../../enum/perfil.enum';
import { Response } from 'express';
import {
  DeletarAvatarDoc,
  PegarAvatarDoc,
  SalvarAvatarDoc,
} from './docs/avatar.swagger';

@ApiTags('Avatar')
@Controller('avatar')
export class AvatarController {
  constructor(private readonly avatarService: AvatarService) { }

  @SalvarAvatarDoc()
  @UseGuards(JwtAuthGuard, PerfilGuard)
  @Perfil(
    USUARIO_PERFIL.AUTOPILOT,
    USUARIO_PERFIL.LOJISTA,
    USUARIO_PERFIL.USUARIO,
  )
  @UseInterceptors(FileInterceptor('file'))
  @Post('usuario/:userId')
  async saveAvatar(
    @Param('userId') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return await this.avatarService.saveAvatar(userId, file);
  }

  @DeletarAvatarDoc()
  @UseGuards(JwtAuthGuard, PerfilGuard)
  @Perfil(
    USUARIO_PERFIL.AUTOPILOT,
    USUARIO_PERFIL.LOJISTA,
    USUARIO_PERFIL.USUARIO,
  )
  @Delete('usuario/:userId')
  async deleteAvatar(
    @Param('userId') userId: string,
  ) {
    await this.avatarService.deleteAvatar(userId);
  }

  @PegarAvatarDoc()
  @Get('usuario/:userId')
  async getAvatar(
    @Param('userId') userId: string,
    @Res() res: Response,
  ) {
    const url = await this.avatarService.getAvatarUrl(userId);

    if (url) {
      res.redirect(url);
      return;
    }
  }
}
