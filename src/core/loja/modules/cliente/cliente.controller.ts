import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Query,
  UseGuards,
  ParseIntPipe,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { ClienteService } from './cliente.service';
import { ApiTags } from '@nestjs/swagger';
import {
  CriarClienteDto,
  EditarClienteDto,
  ListarClienteDto,
} from './dto/cliente.dto';
import {
  AnexoClienteDoc,
  AtivarClienteDoc,
  CriarClienteDoc,
  EditarClienteDoc,
  InativarClienteDoc,
  ListarClienteDoc,
  PegarClienteDoc,
} from './docs/cliente.swagger';
import { Perfil } from 'src/auth/auth/roles-decorators/perfil/perfil.decorator';
import { USUARIO_PERFIL } from 'src/core/usuario/enum/perfil.enum';
import { JwtAuthGuard } from 'src/auth/auth/guards/jwt-auth.guard';
import { PerfilGuard } from 'src/auth/auth/roles-decorators/perfil/perfil.guard';
import { LojaId } from 'src/auth/auth/decorators/loja-id-decorator';
import { UsuarioId } from 'src/auth/auth/decorators/usuario-id-decorator';
import { AnyFilesInterceptor } from '@nestjs/platform-express';

@ApiTags('Cliente')
@UseGuards(JwtAuthGuard, PerfilGuard)
@Controller('cliente')
export class ClienteController {
  constructor(private readonly clienteService: ClienteService) {}

  @CriarClienteDoc()
  @Perfil(USUARIO_PERFIL.USUARIO, USUARIO_PERFIL.LOJISTA)
  @Post('/criar')
  async criarCliente(
    @LojaId() idLoja: string,
    @UsuarioId() idUsuario: string,
    @Body() criarCliente: CriarClienteDto,
  ) {
    return this.clienteService.criarClienteNaLoja(
      idLoja,
      idUsuario,
      criarCliente,
    );
  }

  @PegarClienteDoc()
  @Perfil(USUARIO_PERFIL.USUARIO, USUARIO_PERFIL.LOJISTA)
  @Get('/pegar/:idCliente')
  async buscarCliente(
    @LojaId() idLoja: string,
    @Param('idCliente') idCliente: string,
  ) {
    return this.clienteService.buscarClientePorId(idLoja, idCliente);
  }

  @ListarClienteDoc()
  @Perfil(USUARIO_PERFIL.USUARIO, USUARIO_PERFIL.LOJISTA)
  @Get('/listar')
  async buscarClientes(
    @LojaId() idLoja: string,
    @Query() params: ListarClienteDto,
  ) {
    return this.clienteService.buscarClientesPorLoja(idLoja, params);
  }

  @EditarClienteDoc()
  @Perfil(USUARIO_PERFIL.USUARIO, USUARIO_PERFIL.LOJISTA)
  @Put('/editar/:idCliente')
  async editarCliente(
    @LojaId() idLoja: string,
    @UsuarioId() idUsuario: string,
    @Param('idCliente') idCliente: string,
    @Body() editarCliente: EditarClienteDto,
  ) {
    return this.clienteService.editarClienteNaLoja(
      idLoja,
      idUsuario,
      idCliente,
      editarCliente,
    );
  }

  @InativarClienteDoc()
  @Perfil(USUARIO_PERFIL.USUARIO, USUARIO_PERFIL.LOJISTA)
  @Put('/inativar/:idCliente')
  async inativarCliente(
    @LojaId() idLoja: string,
    @UsuarioId() idUsuario: string,
    @Param('idCliente') idCliente: string,
  ) {
    return this.clienteService.invativarClienteNaLoja(
      idLoja,
      idUsuario,
      idCliente,
    );
  }


  @UseInterceptors(AnyFilesInterceptor())
  @AnexoClienteDoc()
  @Perfil(USUARIO_PERFIL.USUARIO, USUARIO_PERFIL.LOJISTA)
  @Post("/anexo/:idCliente")
  async enviarAnexoCliente(
    @LojaId() idLoja: string,
    @UploadedFiles() arquivos: Express.Multer.File[],
    @Param('idCliente') idCliente: string,
  
  ){
    return this.clienteService.enviarAnexo(idLoja, idCliente, arquivos);
  }

  @AtivarClienteDoc()
  @Perfil(USUARIO_PERFIL.USUARIO, USUARIO_PERFIL.LOJISTA)
  @Put('/ativar/:idCliente')
  async ativarCliente(
    @LojaId() idLoja: string,
    @UsuarioId() idUsuario: string,
    @Param('idCliente') idCliente: string,
  ) {
    return this.clienteService.ativarClienteNaLoja(
      idLoja,
      idUsuario,
      idCliente,
    );
  }

  @UseInterceptors(
    AnyFilesInterceptor({
      limits: {
        fileSize: 30 * 1024 * 1024, // 30MB
      },
    }),
  )
  @Perfil(USUARIO_PERFIL.USUARIO, USUARIO_PERFIL.LOJISTA)
  @Post('/importar')
  async importarClientes(
    @LojaId() idLoja: string,
    @UsuarioId() idUsuario: string,
    @UploadedFiles() arquivos: Express.Multer.File[],
    @Param('app') app: 'autoConf' | 'revendaMais',
  ) {
    return this.clienteService.importarClientes(idLoja, idUsuario, arquivos[0], app);
  }
}
