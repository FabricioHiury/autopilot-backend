import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsString,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  IsOptional,
  IsInt,
} from 'class-validator';
import { PERMISSOES_LOJA } from 'src/core/usuario/enum/permissoes_funcionalidades.enum';

@ValidatorConstraint({ name: 'isInEnum', async: false })
export class IsInEnum implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    if (Array.isArray(value)) {
      return value.every((val) => Object.values(PERMISSOES_LOJA).includes(val));
    }
    return false;
  }

  defaultMessage(args: ValidationArguments) {
    return `Os valores aceitos no array de permissões são: ${Object.values(PERMISSOES_LOJA).join(', ')}`;
  }
}

export class CriarCargoDto {

  @ApiProperty({ example: 1, description: 'Id do cargo' })
  @IsInt()
  @IsOptional()
  id?: string;

  @ApiProperty({ example: 'Gerente', description: 'Nome do cargo' })
  @IsString()
  @IsNotEmpty()
  cargo: string;

  @ApiProperty({
    example: ['lojaVerAtendimentos', 'lojaVerDashboard'],
    isArray: true,
    type: String,
    enum: PERMISSOES_LOJA,
  })
  @IsArray()
  @IsNotEmpty({ each: true })
  @IsString({ each: true })
  @Validate(IsInEnum)
  funcionalidades: string[];
}
