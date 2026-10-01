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
import { StoreId } from 'src/auth/auth/decorators/store-id-decorator';
import { UpdateTagDto } from './dto/update-tag.dto';
import { LinkTagsDto } from './dto/link-tags.dto';
import { JwtAuthGuard } from 'src/auth/auth/guards/jwt-auth.guard';
import { TagFiltersDto } from './dto/filter-tags.dto';

@ApiTags('Tags of Deal')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tag' })
  @ApiResponse({ status: 201, description: 'Tag created with success' })
  @ApiResponse({
    status: 409,
    description: 'There is already a tag with this name',
  })
  async createTag(
    @StoreId() storeId: string,
    @Body() createTagDto: CreateTagDto,
  ) {
    return this.tagsService.createTag(storeId, createTagDto);
  }

  @Get()
  @ApiOperation({ summary: 'List tags with pagination and search' })
  @ApiResponse({
    status: 200,
    description: 'List of tags retornada with success',
  })
  async listTags(@StoreId() storeId: string, @Query() filters: TagFiltersDto) {
    return this.tagsService.listTags(storeId, filters);
  }

  @Get(':idTag')
  @ApiOperation({ summary: 'Get a tag by ID' })
  @ApiResponse({ status: 200, description: 'Tag found' })
  @ApiResponse({ status: 404, description: 'Tag not found' })
  async getTagById(@StoreId() storeId: string, @Param('idTag') idTag: string) {
    return this.tagsService.getTagById(storeId, idTag);
  }

  @Put(':idTag')
  @ApiOperation({ summary: 'Update a tag' })
  @ApiResponse({ status: 200, description: 'Tag updated with success' })
  @ApiResponse({ status: 404, description: 'Tag not found' })
  @ApiResponse({
    status: 409,
    description: 'There is already a tag with this name',
  })
  async updateTag(
    @StoreId() storeId: string,
    @Param('idTag') idTag: string,
    @Body() updateTagDto: UpdateTagDto,
  ) {
    return this.tagsService.updateTag(storeId, idTag, updateTagDto);
  }

  @Delete(':idTag')
  @ApiOperation({ summary: 'Delete a tag' })
  @ApiResponse({ status: 200, description: 'Tag deleted with success' })
  @ApiResponse({ status: 404, description: 'Tag not found' })
  async deleteTag(@StoreId() storeId: string, @Param('idTag') idTag: string) {
    return this.tagsService.deleteTag(storeId, idTag);
  }

  @Post('deal/:dealId/link')
  @ApiOperation({ summary: 'Link tags a a deal' })
  @ApiResponse({ status: 200, description: 'Tags vinculadas with success' })
  @ApiResponse({
    status: 404,
    description: 'Deal or tags not found',
  })
  async linkTagsToTicket(
    @StoreId() storeId: string,
    @Param('dealId') dealId: string,
    @Body() linkTagsDto: LinkTagsDto,
  ) {
    return this.tagsService.linkTagsToTicket(storeId, dealId, linkTagsDto);
  }

  @Delete('deal/:dealId/:idTag')
  @ApiOperation({ summary: 'Unlink a tag of a deal' })
  @ApiResponse({ status: 200, description: 'Tag desvinculada with success' })
  @ApiResponse({
    status: 404,
    description: 'Deal or link not found',
  })
  async unlinkTagFromTicket(
    @StoreId() storeId: string,
    @Param('dealId') dealId: string,
    @Param('idTag') idTag: string,
  ) {
    return this.tagsService.unlinkTagFromTicket(storeId, dealId, idTag);
  }
}
