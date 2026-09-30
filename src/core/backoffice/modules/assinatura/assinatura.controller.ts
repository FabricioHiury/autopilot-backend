import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  AtivarAssinaturaDoc,
  BuscarAssinaturaPorIdLojaDoc,
  BuscarEstatisticasAssinaturasDoc,
  DesativarAssinaturaDoc,
  ListarAssinantesDoc,
} from './docs/assinatura.swagger';
import { JwtAuthGuard } from 'src/auth/auth/guards/jwt-auth.guard';
import { AssinaturaService } from './assinatura.service';
import { PerfilGuard } from 'src/auth/auth/roles-decorators/perfil/perfil.guard';
import { ApiTags } from '@nestjs/swagger';
import { PermissoesGuard } from 'src/auth/auth/roles-decorators/permissoes/permissoes.guard';
import { ListarAssinantesDto } from './dto/listar-assinantes';
import { Perfil } from 'src/auth/auth/roles-decorators/perfil/perfil.decorator';
import { USUARIO_PERFIL } from 'src/core/usuario/enum/perfil.enum';
import { PERMISSOES_AUTOPILOT } from 'src/core/usuario/enum/permissoes_funcionalidades.enum';
import { Permissoes } from 'src/auth/auth/roles-decorators/permissoes/permissoes.decorator';
import { CriarAssinaturaDto } from './dto/criar-assinatura.dto';

@ApiTags('AutoPilot - assinatura')
@Controller('backoffice/assinatura')
@UseGuards(JwtAuthGuard, PerfilGuard, PermissoesGuard)
@Perfil(USUARIO_PERFIL.AUTOPILOT)
export class AssinaturaController {
  constructor(private readonly assinaturaService: AssinaturaService) {}

  @ListarAssinantesDoc()
  @Permissoes([PERMISSOES_AUTOPILOT.AUTOPILOT_VER_ASSINANTES])
  @Get('/')
  async listarAssinantes(@Query() listarAssinantesDto: ListarAssinantesDto) {
    return await this.assinaturaService.listarAssinantes(listarAssinantesDto);
  }

  @Post('/')
  @Permissoes([PERMISSOES_AUTOPILOT.AUTOPILOT_EDITAR_ASSINANTES_ADICIONAR])
  async criarAssinatura(@Body() criarAssinaturaDto: CriarAssinaturaDto) {
    return await this.assinaturaService.criarAssinatura(criarAssinaturaDto);
  }

  @ListarAssinantesDoc()
  @Permissoes([PERMISSOES_AUTOPILOT.AUTOPILOT_VER_ASSINANTES])
  @Get('/lojas')
  async listarLojas(@Query() listarAssinantesDto: ListarAssinantesDto) {
    return await this.assinaturaService.listarLojas(listarAssinantesDto);
  }

  @BuscarEstatisticasAssinaturasDoc()
  @Permissoes([PERMISSOES_AUTOPILOT.AUTOPILOT_VER_ASSINANTES])
  @Get('/estatisticas')
  async buscarEstatisticasAssinaturas() {
    return await this.assinaturaService.buscarEstatisticasAssinaturas();
  }

  @BuscarAssinaturaPorIdLojaDoc()
  @Permissoes([PERMISSOES_AUTOPILOT.AUTOPILOT_VER_ASSINANTES])
  @Get('/loja/:idLoja')
  async buscarAssinantePorIdLoja(
    @Param('idLoja') idLoja: string,
  ) {
    return await this.assinaturaService.buscarAssinantePorIdLoja(idLoja);
  }

  @DesativarAssinaturaDoc()
  @Permissoes([PERMISSOES_AUTOPILOT.AUTOPILOT_EDITAR_ASSINANTES_ADICIONAR])
  @Put('/loja/:idLoja/desativar')
  async desativarAssinatura(@Param('idLoja') idLoja: string) {
    return await this.assinaturaService.cancelarAssinaturaPorLoja(idLoja);
  }

  @AtivarAssinaturaDoc()
  @Permissoes([PERMISSOES_AUTOPILOT.AUTOPILOT_EDITAR_ASSINANTES_ADICIONAR])
  @Put('/loja/:idLoja/ativar')
  async ativarAssinatura(@Param('idLoja') idLoja: string) {
    return await this.assinaturaService.ativarAssinatura(idLoja);
  }
}
