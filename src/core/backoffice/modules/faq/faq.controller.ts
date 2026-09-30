import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ViewApiKeyGuard } from 'src/auth/auth/guards/incrementa-view.guard';
import { JwtAuthGuard } from 'src/auth/auth/guards/jwt-auth.guard';
import { Perfil } from 'src/auth/auth/roles-decorators/perfil/perfil.decorator';
import { PerfilGuard } from 'src/auth/auth/roles-decorators/perfil/perfil.guard';
import { USUARIO_PERFIL } from 'src/core/usuario/enum/perfil.enum';
import {
  ContarViewsDoc,
  criarFaqDoc,
  DeletarFaqDoc,
  listarFaqDoc,
  ObterFaqPorIdDoc,
  ObterFaqPorSlugDoc,
} from './docs/faqs.swagger';
import { AtualizarFaqDto } from './dto/atualizar-faq.dto';
import { CriarFaqDto } from './dto/criar-faq.dto';
import { ListarFaqDto } from './dto/listar-faq.dto';
import { FaqService } from './faq.service';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { UsuarioId } from 'src/auth/auth/decorators/usuario-id-decorator';
import { Response } from 'express';

@ApiTags('FAQs')
@Controller('faq')
export class FaqController {
  constructor(private readonly faqService: FaqService) {}

  @UseGuards(JwtAuthGuard, PerfilGuard)
  @Perfil(USUARIO_PERFIL.AUTOPILOT)
  @criarFaqDoc()
  @Post()
  async criarFaq(@Body() data: CriarFaqDto) {
    return this.faqService.criarFaq(data);
  }

  @listarFaqDoc()
  @Get()
  async listarFaqs(@Query() queries: ListarFaqDto) {
    return await this.faqService.listarFaqs(queries);
  }

  @ObterFaqPorIdDoc()
  @Get(':id')
  async obterFaqPorId(@Param('id') id: string) {
    return await this.faqService.obterFaqPorId(id);
  }

  @ObterFaqPorSlugDoc()
  @Get('slug/:slug')
  async obterFaqPorSlug(@Param('slug') slug: string) {
    return await this.faqService.obterFaqPorSlug(slug);
  }

  @UseGuards(JwtAuthGuard, PerfilGuard)
  @Perfil(USUARIO_PERFIL.AUTOPILOT)
  @criarFaqDoc()
  @Put(':id')
  async editarFaq(
    @Param('id') id: string,
    @Body() data: AtualizarFaqDto,
  ) {
    return await this.faqService.editarFaq(id, data);
  }

  @ContarViewsDoc()
  @Post('views/:id')
  @UseGuards(ViewApiKeyGuard)
  async contarViews(@Param('id') id: string) {
    return await this.faqService.contarViews(id);
  }

  @UseGuards(JwtAuthGuard, PerfilGuard)
  @Perfil(USUARIO_PERFIL.AUTOPILOT)
  @DeletarFaqDoc()
  @Delete(':id')
  async deletarFaq(@Param('id') id: string) {
    return await this.faqService.deletarFaq(id);
  }

  @UseGuards(JwtAuthGuard, PerfilGuard)
  @Perfil(USUARIO_PERFIL.AUTOPILOT)
  @UseInterceptors(AnyFilesInterceptor())
  @Post('imagem')
  async salvarImagemPublica(
    @UsuarioId() idUsuario: string,
    @UploadedFiles() arquivos: Express.Multer.File[],
  ) {
    return await this.faqService.salvarImagemPublica({
      usuarioId: idUsuario,
      arquivo: arquivos,
    });
  }

  @Get('imagens/:imagemId')
  async pegarImagemPublica(
    @Param('imagemId') imagemId: string,
    @Res() res: Response,
  ) {
    const url = await this.faqService.pegarImagemPublica(imagemId);

    if (url) {
      res.redirect(url);
    }
  }
}
