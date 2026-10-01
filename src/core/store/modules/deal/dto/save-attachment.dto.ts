import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class SaveAttachmentDealDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description:
      'Formatos accepted: image/jpeg, image/jpg, image/webp, image/png, application/pdf',
  })
  @IsOptional()
  file: Express.Multer.File;
}
