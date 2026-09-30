import { Body, Controller, Delete, Get, Put, UseGuards } from '@nestjs/common';
import { LojaCargoService } from './cargo.service';
import { JwtAuthGuard } from 'src/auth/auth/guards/jwt-auth.guard';
import { PermissoesGuard } from 'src/auth/auth/roles-decorators/permissoes/permissoes.guard';
import { ApiTags } from '@nestjs/swagger';
import { CriarCargoDto } from './dto/criar-cargo.dto';
import { LojaId } from 'src/auth/auth/decorators/loja-id-decorator';
import {
  CriarCargoDoc,
  DeletarCargoDoc,
  ListarCargosDoc,
} from './docs/cargo.swagger';
import { Permissoes } from 'src/auth/auth/roles-decorators/permissoes/permissoes.decorator';
import { PERMISSOES_LOJA } from 'src/core/usuario/enum/permissoes_funcionalidades.enum';

@ApiTags('Loja - cargos')
@UseGuards(JwtAuthGuard, PermissoesGuard)
@Controller('loja/cargo')
export class LojaCargoController {
  constructor(private readonly lojaCargoService: LojaCargoService) {}

  @ListarCargosDoc()
  @Get('/')
  async listarCargos(@LojaId() idLoja: string) {
    return await this.lojaCargoService.listarCargos(idLoja);
  }

  @CriarCargoDoc()
  @Permissoes([PERMISSOES_LOJA.LOJA_GERENCIAR_CARGOS])
  @Put('/')
  async criarCargo(@LojaId() idLoja: string, @Body() params: CriarCargoDto) {
    return await this.lojaCargoService.criarCargo(idLoja, params);
  }

  @DeletarCargoDoc()
  @Permissoes([PERMISSOES_LOJA.LOJA_GERENCIAR_CARGOS])
  @Delete('/')
  async deletarCargo(@LojaId() idLoja: string, @Body('id') idCargo: string) {
    return this.lojaCargoService.deletarCargo(idLoja, idCargo);
  }
}
