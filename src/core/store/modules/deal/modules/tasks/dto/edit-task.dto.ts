import { PartialType } from '@nestjs/swagger';
import { CreateTaskDto } from './create-task.dto';

export class EditTaskDto extends PartialType(CreateTaskDto) {}
