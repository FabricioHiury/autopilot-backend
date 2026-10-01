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
import { Profile } from 'src/auth/auth/roles-decorators/profile/profile.decorator';
import { ProfileGuard } from 'src/auth/auth/roles-decorators/profile/profile.guard';
import { USER_PROFILE } from 'src/core/user/enum/profile.enum';
import {
  CountViewsDoc,
  createFaqDoc,
  DeleteFaqDoc,
  listFaqDoc,
  GetFaqByIdDoc,
  GetFaqBySlugDoc,
} from './docs/faqs.swagger';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { CreateFaqDto } from './dto/create-faq.dto';
import { ListFaqDto } from './dto/list-faq.dto';
import { FaqService } from './faq.service';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { UserId } from 'src/auth/auth/decorators/user-id-decorator';
import { Response } from 'express';

@ApiTags('FAQs')
@Controller('faq')
export class FaqController {
  constructor(private readonly faqService: FaqService) {}

  @UseGuards(JwtAuthGuard, ProfileGuard)
  @Profile(USER_PROFILE.AUTOPILOT)
  @createFaqDoc()
  @Post()
  async createFaq(@Body() data: CreateFaqDto) {
    return this.faqService.createFaq(data);
  }

  @listFaqDoc()
  @Get()
  async listFaqs(@Query() queries: ListFaqDto) {
    return await this.faqService.listFaqs(queries);
  }

  @GetFaqByIdDoc()
  @Get(':id')
  async getFaqById(@Param('id') id: string) {
    return await this.faqService.getFaqById(id);
  }

  @GetFaqBySlugDoc()
  @Get('slug/:slug')
  async getFaqBySlug(@Param('slug') slug: string) {
    return await this.faqService.getFaqBySlug(slug);
  }

  @UseGuards(JwtAuthGuard, ProfileGuard)
  @Profile(USER_PROFILE.AUTOPILOT)
  @createFaqDoc()
  @Put(':id')
  async editFaq(@Param('id') id: string, @Body() data: UpdateFaqDto) {
    return await this.faqService.editFaq(id, data);
  }

  @CountViewsDoc()
  @Post('views/:id')
  @UseGuards(ViewApiKeyGuard)
  async countViews(@Param('id') id: string) {
    return await this.faqService.countViews(id);
  }

  @UseGuards(JwtAuthGuard, ProfileGuard)
  @Profile(USER_PROFILE.AUTOPILOT)
  @DeleteFaqDoc()
  @Delete(':id')
  async deleteFaq(@Param('id') id: string) {
    return await this.faqService.deleteFaq(id);
  }

  @UseGuards(JwtAuthGuard, ProfileGuard)
  @Profile(USER_PROFILE.AUTOPILOT)
  @UseInterceptors(AnyFilesInterceptor())
  @Post('image')
  async saveImagePublic(
    @UserId() userId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return await this.faqService.saveImagePublic({
      userId: userId,
      file: files,
    });
  }

  @Get('imagens/:imageId')
  async getImagePublic(
    @Param('imageId') imageId: string,
    @Res() res: Response,
  ) {
    const url = await this.faqService.getImagePublic(imageId);

    if (url) {
      res.redirect(url);
    }
  }
}
