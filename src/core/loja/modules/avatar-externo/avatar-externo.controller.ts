import { Controller, Get, Param, ParseEnumPipe, ParseIntPipe, Res, UseGuards } from '@nestjs/common';
import { AvatarExternoService } from './avatar-externo.service';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/auth/guards/jwt-auth.guard';
import { PermissoesGuard } from 'src/auth/auth/roles-decorators/permissoes/permissoes.guard';
import { ENUM_TIPO_AVATAR_EXTERNO } from './enum/tipo-avatar-externo.enum';
import { Response } from 'express';
import { LojaId } from 'src/auth/auth/decorators/loja-id-decorator';

@ApiTags('Avatar Externo')
@UseGuards(JwtAuthGuard, PermissoesGuard)
@Controller('avatar-externo')
export class AvatarExternoController {
  
  constructor(private readonly avatarExternoService: AvatarExternoService) {}

    @Get('/:tipo/:id')
    async pegarAvatar(
      @LojaId() idLoja: string,
      @Param('tipo', new ParseEnumPipe(ENUM_TIPO_AVATAR_EXTERNO)) tipo: ENUM_TIPO_AVATAR_EXTERNO,
      @Param('id') id: string,
      @Res() res: Response,
    ) {
      
      const url = await this.avatarExternoService.pegarUrlAvatar({
        idLoja,
        tipo,
        id,
      })
  
      if (url) {
        res.redirect(url);
        return;
      }
    }
}
