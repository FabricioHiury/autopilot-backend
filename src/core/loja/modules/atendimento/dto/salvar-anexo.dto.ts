import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class SalvarAnexoAtendimentoDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description:
      'Formatos aceitos: image/jpeg, image/jpg, image/webp, image/png, application/pdf',
  })
  @IsOptional()
  arquivo: Express.Multer.File;
}
