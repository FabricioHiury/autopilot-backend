import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/auth/guards/jwt-auth.guard';
import { PerfilGuard } from 'src/auth/auth/roles-decorators/perfil/perfil.guard';
import { PermissoesGuard } from 'src/auth/auth/roles-decorators/permissoes/permissoes.guard';
import { Perfil } from 'src/auth/auth/roles-decorators/perfil/perfil.decorator';
import { Permissoes } from 'src/auth/auth/roles-decorators/permissoes/permissoes.decorator';
import { USUARIO_PERFIL } from 'src/core/usuario/enum/perfil.enum';
import { PERMISSOES_AUTOPILOT } from 'src/core/usuario/enum/permissoes_funcionalidades.enum';
import { PlanosService } from './planos.service';
import { CriarPlanoDto } from './dto/criar-plano.dto';
import { EditarPlanoDto } from './dto/editar-plano.dto';
import { ListarPlanosDto } from './dto/listar-planos.dto';

@ApiTags('AutoPilot - planos')
@Controller('backoffice/planos')
@UseGuards(JwtAuthGuard, PerfilGuard, PermissoesGuard)
@Perfil(USUARIO_PERFIL.AUTOPILOT)
export class PlanosController {
  constructor(private readonly planosService: PlanosService) {}

  @Post()
  @Permissoes([PERMISSOES_AUTOPILOT.AUTOPILOT_EDITAR_ASSINANTES_ADICIONAR])
  async criarPlano(@Body() criarPlanoDto: CriarPlanoDto) {
    return await this.planosService.criarPlano(criarPlanoDto);
  }

  @Get()
  @Permissoes([PERMISSOES_AUTOPILOT.AUTOPILOT_VER_ASSINANTES])
  async listarPlanos(@Query() listarPlanosDto: ListarPlanosDto) {
    return await this.planosService.listarPlanos(listarPlanosDto);
  }

  @Get('sincronizar-stripe')
  @Permissoes([PERMISSOES_AUTOPILOT.AUTOPILOT_EDITAR_ASSINANTES_ADICIONAR])
  async sincronizarComStripe() {
    return await this.planosService.sincronizarComStripe();
  }

  @Get(':id')
  @Permissoes([PERMISSOES_AUTOPILOT.AUTOPILOT_VER_ASSINANTES])
  async buscarPlanoPorId(@Param('id') id: string) {
    return await this.planosService.buscarPlanoPorId(id);
  }

  @Put(':id')
  @Permissoes([PERMISSOES_AUTOPILOT.AUTOPILOT_EDITAR_ASSINANTES_ADICIONAR])
  async editarPlano(
    @Param('id') id: string,
    @Body() editarPlanoDto: EditarPlanoDto,
  ) {
    return await this.planosService.editarPlano(id, editarPlanoDto);
  }

  @Delete(':id')
  @Permissoes([PERMISSOES_AUTOPILOT.AUTOPILOT_EDITAR_ASSINANTES_ADICIONAR])
  async deletarPlano(@Param('id') id: string) {
    return await this.planosService.deletarPlano(id);
  }
}