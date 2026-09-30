import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString, Validate } from 'class-validator';
import { PERMISSOES_AUTOPILOT } from 'src/core/usuario/enum/permissoes_funcionalidades.enum';
import { IsInEnum } from '../utils/admin.utils';

export class PermissoesAdminDto {
  @ApiProperty({
    example: ['autopilotVerAssinantes', 'autopilotVerDashboard'],
    isArray: true,
    type: String,
    enum: PERMISSOES_AUTOPILOT,
  })
  @IsArray()
  @IsNotEmpty({ each: true })
  @IsString({ each: true })
  @Validate(IsInEnum, { each: true })
  permissoes: string[];
}
