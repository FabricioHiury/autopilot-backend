import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsString,
  IsOptional,
} from 'class-validator';
import {
  StatusNotificationEnum,
  TypesNotificationEnum,
} from 'src/utils/enum/notifications.enum'; // Ajuste o caminho conforme necessário

export class UpdateStatusNotificationDto {
  @ApiProperty({
    description: 'Status of notification a be changed',
    example: StatusNotificationEnum.VIEWED,
    enum: StatusNotificationEnum, // Ajuste conforme os valores do seu enum
  })
  @IsNotEmpty()
  @IsEnum(StatusNotificationEnum)
  status: StatusNotificationEnum;
}

export class ListNotificationDto {
  @ApiProperty({
    description: 'Status of notification',
    example: StatusNotificationEnum.VIEWED,
    enum: StatusNotificationEnum, // Ajuste conforme os valores do seu enum
  })
  @IsOptional()
  @IsEnum(StatusNotificationEnum)
  status?: StatusNotificationEnum;
}

export class CreateNotificationDto {
  @ApiProperty({
    description: 'ID of user that will receive a notification',
    example: 1,
  })
  @IsNumber()
  userId: string;

  @ApiProperty({
    description: 'ID of object of notification',
    example: 10,
  })
  @IsNumber()
  @IsOptional()
  idReference?: string;

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
