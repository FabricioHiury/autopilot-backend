import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { LojaService } from './loja.service';
import { JwtAuthGuard } from 'src/auth/auth/guards/jwt-auth.guard';
import {
  CadastrarContatoLojaDoc,
  CadastrarEnderecoLojaDoc,
  CadastroLojaDoc,
  DeletarEnderecoLojaDoc,
  EditarLojaDoc,
  ListarLojasDoc,
  PegarLojaDoc,
  StatusAssinaturaDoc,
} from './docs/loja.swagger';
import {
  CadastroEnderecoDto,
  CadastroLojistaDto,
  EditarContatoDto,
  EditarLojaDto,
  ListarLojaDto,
} from './dto/loja.dto';
import { LojaId } from 'src/auth/auth/decorators/loja-id-decorator';
import { ApiTags } from '@nestjs/swagger';
import { UsuarioId } from 'src/auth/auth/decorators/usuario-id-decorator';
import { Perfil } from 'src/auth/auth/roles-decorators/perfil/perfil.decorator';
import { USUARIO_PERFIL } from '../usuario/enum/perfil.enum';
import { FileInterceptor } from '@nestjs/platform-express';
import { Permissoes } from 'src/auth/auth/roles-decorators/permissoes/permissoes.decorator';
import { PERMISSOES_LOJA } from '../usuario/enum/permissoes_funcionalidades.enum';
import { PermissoesGuard } from 'src/auth/auth/roles-decorators/permissoes/permissoes.guard';

@ApiTags('Loja')
@Controller('loja')
export class LojaController {
  constructor(private readonly lojaService: LojaService) { }

  @PegarLojaDoc()
  @Get('/')
  @UseGuards(JwtAuthGuard)
  @Perfil(USUARIO_PERFIL.LOJISTA, USUARIO_PERFIL.AUTOPILOT)
  async pegarLojistaPorId(@LojaId() id: string) {
    return await this.lojaService.pegarLojaPorId(id);
  }

  @CadastroLojaDoc()
  @Post('/cadastrar')
  @HttpCode(201)
  async criarLojista(@Body() cadastroLojistaDto: CadastroLojistaDto) {
    return await this.lojaService.cadastrarLojista(cadastroLojistaDto);
  }

  @Post('confirmar-email')
  @HttpCode(201)
  async confirmarEmail(@Body() params: { token: string }) {
    return await this.lojaService.confirmarEmail(params.token);
  }

  @CadastrarEnderecoLojaDoc()
  @Put('/endereco')
  @UseGuards(JwtAuthGuard, PermissoesGuard)
  @Permissoes([PERMISSOES_LOJA.LOJA_EDITAR_DADOS_DA_LOJA])
  async editarEndereco(
    @LojaId() idLoja: string,
    @Body() params: CadastroEnderecoDto,
  ) {
    return await this.lojaService.cadastrarEndereco(params, idLoja);
  }

  @DeletarEnderecoLojaDoc()
  @Delete('/endereco/:idEndereco')
  @UseGuards(JwtAuthGuard, PermissoesGuard)
  @HttpCode(200)
  @Permissoes([PERMISSOES_LOJA.LOJA_EDITAR_DADOS_DA_LOJA])
  async deletarEndereco(
    @LojaId() idLoja: string,
    @Param('idEndereco') idEndereco: string,
  ) {
    return await this.lojaService.deletarEndereco(idLoja, idEndereco);
  }

  @CadastrarContatoLojaDoc()
  @Put('/contato')
  @UseGuards(JwtAuthGuard, PermissoesGuard)
  @Permissoes([PERMISSOES_LOJA.LOJA_EDITAR_DADOS_DA_LOJA])
  async cadastrarContato(
    @LojaId() idLoja: string,
    @Body() params: EditarContatoDto,
  ) {
    return await this.lojaService.cadastrarContato(idLoja, params);
  }

  @StatusAssinaturaDoc()
  @UseGuards(JwtAuthGuard)
  @Get('/status-assinatura')
  async statusAssinatura(@LojaId() idLoja: string) {
    return await this.lojaService.statusAssinatura(idLoja);
  }

  @ListarLojasDoc()
  @Get('/listar')
  @UseGuards(JwtAuthGuard)
  async listarLojistas(@Query() lista: ListarLojaDto) {
    return await this.lojaService.listarLojista(lista);
  }

  @EditarLojaDoc()
  @Put('/editar')
  @UseGuards(JwtAuthGuard, PermissoesGuard)
  @Permissoes([PERMISSOES_LOJA.LOJA_EDITAR_DADOS_DA_LOJA])
  async editarLojista(
    @Body() editarLojistaDto: EditarLojaDto,
    @LojaId() idLoja: string,
  ) {
    return await this.lojaService.editarLoja(editarLojistaDto, idLoja);
  }

  @Get('/meu-acesso')
  @UseGuards(JwtAuthGuard)
  async meusAcessos(
    @UsuarioId() idUsuario: string,
    @LojaId() idLoja: string,
  ) {
    return await this.lojaService.pegarAcessoPorIdUsuario(idUsuario, idLoja);
  }

  @UseInterceptors(FileInterceptor('file'))
  @Post('/update-logo')
  @UseGuards(JwtAuthGuard, PermissoesGuard)
  @Permissoes([PERMISSOES_LOJA.LOJA_EDITAR_DADOS_DA_LOJA])
  async updateLogo(
    @LojaId() storeId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return await this.lojaService.updateLogo(storeId, file);
  }
}
