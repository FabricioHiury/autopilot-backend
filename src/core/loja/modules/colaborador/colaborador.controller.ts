import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ColaboradorService } from './colaborador.service';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { Perfil } from 'src/auth/auth/roles-decorators/perfil/perfil.decorator';
import { USUARIO_PERFIL } from 'src/core/usuario/enum/perfil.enum';
import { JwtAuthGuard } from 'src/auth/auth/guards/jwt-auth.guard';
import { PerfilGuard } from 'src/auth/auth/roles-decorators/perfil/perfil.guard';
import {
  CriarColaboradorDto,
  EditarColaboradorDto,
  EditarStatusColaboradorDto,
} from './dto/colaborador.dto';
import { LojaId } from 'src/auth/auth/decorators/loja-id-decorator';
import {
  buscarColaboradorDoc,
  buscarTodosColaboradoresDoc,
  criarColaboradorDoc,
  editarColaboradorDoc,
  editarColaboresDoc,
} from './docs/colaborador.swagger';
import { ListarColaboradoresDto } from './dto/listar-colaboradores.dto';

@ApiTags('Colaborador')
@UseGuards(JwtAuthGuard, PerfilGuard)
@Controller('colaborador')
export class ColaboradorController {
  constructor(private readonly colaboradorService: ColaboradorService) { }

  @criarColaboradorDoc()
  @Perfil(USUARIO_PERFIL.LOJISTA)
  @ApiBody({ type: CriarColaboradorDto })
  @Post('/criar-colaborador')
  async createColaborator(
    @LojaId() storeId: string,
    @Body() dto: CriarColaboradorDto,
  ) {
    return await this.colaboradorService.createColaborador(storeId, dto);
  }

  @editarColaboradorDoc()
  @Perfil(USUARIO_PERFIL.LOJISTA)
  @ApiBody({ type: EditarColaboradorDto })
  @Put('/editar-colaborador/:idColaborador')
  async updateColaborador(
    @Param('idColaborador') colaboradorId: string,
    @LojaId() storeId: string,
    @Body() dto: EditarColaboradorDto,
  ) {
    return await this.colaboradorService.updateColaborador(colaboradorId, storeId, dto);
  }

  @buscarTodosColaboradoresDoc()
  @Perfil(USUARIO_PERFIL.LOJISTA, USUARIO_PERFIL.USUARIO)
  @Get('/busca-colaboradores')
  async getAllColaborators(
    @LojaId() storeId: string,
    @Query() params: ListarColaboradoresDto,
  ) {
    return await this.colaboradorService.getAllColaborators(storeId, params);
  }

  @buscarColaboradorDoc()
  @Perfil(USUARIO_PERFIL.LOJISTA, USUARIO_PERFIL.USUARIO)
  @Get('/busca-colaborador/:idColaborador')
  async getColaborator(
    @Param('idColaborador') colaboradorId: string,
    @LojaId() storeId: string,
  ) {
    return await this.colaboradorService.getColaborador(colaboradorId, storeId);
  }

  @editarColaboresDoc()
  @Perfil(USUARIO_PERFIL.LOJISTA)
  @Put('alterar-status/:idColaborador')
  async updateColaboratorStatus(
    @Param('idColaborador') colaboradorId: string,
    @LojaId() storeId: string,
    @Body() dto: EditarStatusColaboradorDto,
  ) {
    return await this.colaboradorService.updateColaboradorStatus(colaboradorId, storeId, dto);
  }
}
