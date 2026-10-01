import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEnum, IsNumber, IsString } from 'class-validator';
import {
  StatusNotificationEnum,
  TypesNotificationEnum,
} from 'src/utils/enum/notifications.enum';

export class ListNotificationResonseDto {
  @ApiProperty({
    description: 'ID of notification',
    example: 1,
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Status of notification',
    example: StatusNotificationEnum.VIEWED,
  })
  @IsNotEmpty()
  @IsEnum(StatusNotificationEnum)
  status: StatusNotificationEnum;

  @ApiProperty({
    description: 'Type of notification',
    example: TypesNotificationEnum.NEW_DEAL,
  })
  @IsEnum(TypesNotificationEnum)
  type: TypesNotificationEnum;

  @ApiProperty({
    description: 'Message of notification',
    example: 'You have a new message.',
  })
  @IsString()
  message: string;
}
