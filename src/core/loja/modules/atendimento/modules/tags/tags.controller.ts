import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreateTagDto } from './dto/create-tag.dto';
import { TagsService } from './tags.service';
import { LojaId } from 'src/auth/auth/decorators/loja-id-decorator';
import { UpdateTagDto } from './dto/update-tag.dto';
import { LinkTagsDto } from './dto/link-tags.dto';
import { JwtAuthGuard } from 'src/auth/auth/guards/jwt-auth.guard';
import { TagFiltersDto } from './dto/filter-tags.dto';

@ApiTags('Tags de Atendimento')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar uma nova tag' })
  @ApiResponse({ status: 201, description: 'Tag criada com sucesso' })
  @ApiResponse({ status: 409, description: 'Já existe uma tag com este nome' })
  async createTag(
    @LojaId() idLoja: string,
    @Body() createTagDto: CreateTagDto,
  ) {
    return this.tagsService.createTag(idLoja, createTagDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar tags com paginação e pesquisa' })
  @ApiResponse({
    status: 200,
    description: 'Lista de tags retornada com sucesso',
  })
  async listTags(@LojaId() idLoja: string, @Query() filters: TagFiltersDto) {
    return this.tagsService.listTags(idLoja, filters);
  }

  @Get(':idTag')
  @ApiOperation({ summary: 'Obter uma tag por ID' })
  @ApiResponse({ status: 200, description: 'Tag encontrada' })
  @ApiResponse({ status: 404, description: 'Tag não encontrada' })
  async getTagById(@LojaId() idLoja: string, @Param('idTag') idTag: string) {
    return this.tagsService.getTagById(idLoja, idTag);
  }

  @Put(':idTag')
  @ApiOperation({ summary: 'Atualizar uma tag' })
  @ApiResponse({ status: 200, description: 'Tag atualizada com sucesso' })
  @ApiResponse({ status: 404, description: 'Tag não encontrada' })
  @ApiResponse({ status: 409, description: 'Já existe uma tag com este nome' })
  async updateTag(
    @LojaId() idLoja: string,
    @Param('idTag') idTag: string,
    @Body() updateTagDto: UpdateTagDto,
  ) {
    return this.tagsService.updateTag(idLoja, idTag, updateTagDto);
  }

  @Delete(':idTag')
  @ApiOperation({ summary: 'Deletar uma tag' })
  @ApiResponse({ status: 200, description: 'Tag deletada com sucesso' })
  @ApiResponse({ status: 404, description: 'Tag não encontrada' })
  async deleteTag(@LojaId() idLoja: string, @Param('idTag') idTag: string) {
    return this.tagsService.deleteTag(idLoja, idTag);
  }

  @Post('atendimento/:idAtendimento/vincular')
  @ApiOperation({ summary: 'Vincular tags a um atendimento' })
  @ApiResponse({ status: 200, description: 'Tags vinculadas com sucesso' })
  @ApiResponse({
    status: 404,
    description: 'Atendimento ou tags não encontrados',
  })
  async linkTagsToTicket(
    @LojaId() idLoja: string,
    @Param('idAtendimento') idAtendimento: string,
    @Body() linkTagsDto: LinkTagsDto,
  ) {
    return this.tagsService.linkTagsToTicket(
      idLoja,
      idAtendimento,
      linkTagsDto,
    );
  }

  @Delete('atendimento/:idAtendimento/:idTag')
  @ApiOperation({ summary: 'Desvincular uma tag de um atendimento' })
  @ApiResponse({ status: 200, description: 'Tag desvinculada com sucesso' })
  @ApiResponse({
    status: 404,
    description: 'Atendimento ou vinculação não encontrados',
  })
  async unlinkTagFromTicket(
    @LojaId() idLoja: string,
    @Param('idAtendimento') idAtendimento: string,
    @Param('idTag') idTag: string,
  ) {
    return this.tagsService.unlinkTagFromTicket(idLoja, idAtendimento, idTag);
  }
}
