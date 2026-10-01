import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { EditTaskDto } from './dto/edit-task.dto';
import { Profile } from 'src/auth/auth/roles-decorators/profile/profile.decorator';
import { USER_PROFILE } from 'src/core/user/enum/profile.enum';
import { StoreId } from 'src/auth/auth/decorators/store-id-decorator';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/auth/guards/jwt-auth.guard';
import { ProfileGuard } from 'src/auth/auth/roles-decorators/profile/profile.guard';
import {
  UpdateStatusTaskDoc,
  CreateTaskDoc,
  DeleteTaskDoc,
  EditTaskDoc,
  ListTasksDoc,
  GetTaskDoc,
} from './docs/tasks.swagger';
import { UserId } from 'src/auth/auth/decorators/user-id-decorator';

@ApiTags('Tasks')
@UseGuards(JwtAuthGuard, ProfileGuard)
@Controller('deals/:dealId/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @CreateTaskDoc()
  @Profile(USER_PROFILE.USER, USER_PROFILE.STOREOWNER)
  @Post()
  async createTask(
    @StoreId() storeId: string,
    @UserId() userId: string,
    @Param('dealId') dealId: string,
    @Body() createTaskDto: CreateTaskDto,
  ) {
    return this.tasksService.createTask(userId, createTaskDto, dealId, storeId);
  }

  @ListTasksDoc()
  @Profile(USER_PROFILE.USER, USER_PROFILE.STOREOWNER)
  @Get()
  async listTasks(@StoreId() storeId: string, @Param('dealId') dealId: string) {
    return this.tasksService.listTasks(dealId, storeId);
  }

  @GetTaskDoc()
  @Profile(USER_PROFILE.USER, USER_PROFILE.STOREOWNER)
  @Get('/:idTask')
  async getTask(@Param('idTask') idTask: string) {
    return this.tasksService.getTask(idTask);
  }

  @EditTaskDoc()
  @Profile(USER_PROFILE.USER, USER_PROFILE.STOREOWNER)
  @Put('/:idTask')
  async editTask(
    @Param('idTask') idTask: string,
    @Body() updateTaskDto: EditTaskDto,
    @UserId() userId: string,
  ) {
    return this.tasksService.editTask(userId, idTask, updateTaskDto);
  }

  @UpdateStatusTaskDoc()
  @Profile(USER_PROFILE.USER, USER_PROFILE.STOREOWNER)
  @Post('/:idTask')
  async updateStatusTask(
    @Param('idTask') idTask: string,
    @UserId() userId: string,
  ) {
    return this.tasksService.updateStatusTask(userId, idTask);
  }

  @DeleteTaskDoc()
  @Profile(USER_PROFILE.USER, USER_PROFILE.STOREOWNER)
  @Delete('/:idTask')
  async deleteTask(@Param('idTask') idTask: string, @UserId() userId: string) {
    return this.tasksService.deleteTask(idTask, userId);
  }
}
