import { IsString, IsNotEmpty } from 'class-validator';

export class AttachmentDto {
  @IsNotEmpty()
  @IsString()
  readonly attachment: string;
}
