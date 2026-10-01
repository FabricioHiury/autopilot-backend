import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/auth/guards/jwt-auth.guard';
import { StoreId } from 'src/auth/auth/decorators/store-id-decorator';
import { UserId } from 'src/auth/auth/decorators/user-id-decorator';
import { ShareService } from './share.service';
import {
  createShareDoc,
  listSharesDoc,
  removeShareDoc,
} from './docs/share.swagger';

@ApiTags('Deal - share')
@UseGuards(JwtAuthGuard)
@Controller('deals/:dealId/share')
export class ShareController {
  constructor(private readonly shareService: ShareService) {}

  @createShareDoc()
  @Post('/:employeeId')
  async create(
    @Param('dealId') dealId: string,
    @StoreId() storeId: string,
    @UserId() userId: string,
    @Param('employeeId') employeeId: string,
  ) {
    return await this.shareService.create({
      dealId,
      storeId,
      userId,
      employeeId,
    });
  }

  @listSharesDoc()
  @Get()
  async list(@Param('dealId') dealId: string, @StoreId() storeId: string) {
    return await this.shareService.list({ dealId, storeId });
  }

  @removeShareDoc()
  @Delete('/:employeeId')
  async remove(
    @Param('dealId') dealId: string,
    @StoreId() storeId: string,
    @UserId() userId: string,
    @Param('employeeId') employeeId: string,
  ) {
    return await this.shareService.remove({
      dealId,
      storeId,
      userId,
      employeeId,
    });
  }
}
