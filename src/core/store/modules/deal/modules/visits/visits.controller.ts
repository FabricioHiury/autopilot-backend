import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { VisitsService } from './visits.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { Profile } from 'src/auth/auth/roles-decorators/profile/profile.decorator';
import { USER_PROFILE } from 'src/core/user/enum/profile.enum';
import { StoreId } from 'src/auth/auth/decorators/store-id-decorator';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/auth/guards/jwt-auth.guard';
import { ProfileGuard } from 'src/auth/auth/roles-decorators/profile/profile.guard';
import { UserId } from 'src/auth/auth/decorators/user-id-decorator';

@ApiTags('Visits')
@UseGuards(JwtAuthGuard, ProfileGuard)
@Controller('deals/:dealId/visits')
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  @Profile(USER_PROFILE.USER, USER_PROFILE.STOREOWNER)
  @Post()
  async createVisit(
    @StoreId() storeId: string,
    @UserId() userId: string,
    @Param('dealId') dealId: string,
    @Body() createTaskDto: CreateVisitDto,
  ) {
    return this.visitsService.createVisit(
      userId,
      createTaskDto,
      dealId,
      storeId,
    );
  }

  @Profile(USER_PROFILE.USER, USER_PROFILE.STOREOWNER)
  @Get()
  async listVisit(@StoreId() storeId: string, @Param('dealId') dealId: string) {
    return this.visitsService.listVisits(dealId, storeId);
  }

  @Profile(USER_PROFILE.USER, USER_PROFILE.STOREOWNER)
  @Get('/:idVisit')
  async getVisit(@Param('idVisit') idVisit: string) {
    return this.visitsService.getVisit(idVisit);
  }

  @Profile(USER_PROFILE.USER, USER_PROFILE.STOREOWNER)
  @Delete('/:idVisit')
  async deleteVisit(
    @UserId() userId: string,
    @StoreId() storeId: string,
    @Param('dealId') dealId: string,
    @Param('idVisit') idVisit: string,
  ) {
    return this.visitsService.deleteVisit({
      storeId,
      userId,
      idVisit,
      dealId,
    });
  }

  @Profile(USER_PROFILE.USER, USER_PROFILE.STOREOWNER)
  @Post('/:idVisit')
  async updateStatusVisit(
    @Param('idVisit') idVisit: string,
    @UserId() userId: string,
  ) {
    return this.visitsService.completeVisit(userId, idVisit);
  }
}
