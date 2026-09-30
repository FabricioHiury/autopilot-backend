import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
  IsNotEmpty,
  Validate,
} from 'class-validator';
import {
  STATUS_ATENDIMENTO,
  TEMPERATURA_ATENDIMENTO,
  MOTIVOS_PERDA_ATENDIMENTO,
  SUB_MOTIVOS_PERDA_ATENDIMENTO,
  SUBMOTIVOS_POR_MOTIVO,
  ORIGEM_ATENDIMENTO,
} from 'src/utils/enum/atendimento.enum';
import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';

@ValidatorConstraint({ name: 'submotivoValido', async: false })
export class SubmotivoValidoConstraint implements ValidatorConstraintInterface {
  validate(subMotivoPerdido: any, args: ValidationArguments) {
    const object = args.object as any;
    const motivoPerdido = object.motivoPerdido;

    if (!motivoPerdido) {
      return true;
    }

    if (!subMotivoPerdido) {
      return true;
    }

    const submotivosValidos = SUBMOTIVOS_POR_MOTIVO[motivoPerdido];
    return submotivosValidos && submotivosValidos.includes(subMotivoPerdido);
  }

  defaultMessage(args: ValidationArguments) {
    const object = args.object as any;
    const motivoPerdido = object.motivoPerdido;
    const submotivosValidos = SUBMOTIVOS_POR_MOTIVO[motivoPerdido];
    
    return `O submotivo selecionado não é válido para o motivo "${motivoPerdido}". Submotivos válidos: ${submotivosValidos?.join(', ') || 'nenhum'}`;
  }
}

export class EditarAtendimentoDto {
  @ApiProperty({ example: 'Atendimento de teste', required: false })
  @IsOptional()
  @IsString()
  titulo?: string;

  @ApiProperty({ example: 'Descrição...', required: false })
  @IsOptional()
  @IsString()
  descricaoAtendimento?: string;

  @ApiProperty({
    example: STATUS_ATENDIMENTO.SUCESSO,
    enum: STATUS_ATENDIMENTO,
    required: false,
  })
  @IsOptional()
  @IsEnum(STATUS_ATENDIMENTO)
  status?: string;

  @ApiProperty({ example: 'Origem do atendimento', enum: ORIGEM_ATENDIMENTO, required: false })
  @IsOptional()
  @IsEnum(ORIGEM_ATENDIMENTO)
  origemAtendimento?: string;

  @ApiProperty({ example: 'Atendimento de teste', required: false })
  @IsOptional()
  @IsString()
  observacao?: string;

  @ApiProperty({
    example: TEMPERATURA_ATENDIMENTO.FRIO,
    enum: TEMPERATURA_ATENDIMENTO,
    required: false,
  })
  @IsOptional()
  @IsEnum(TEMPERATURA_ATENDIMENTO)
  temperatura?: TEMPERATURA_ATENDIMENTO;

  @ApiProperty({
    example: ['8681cf27-db80-4fdb-8446-82844110a627', '8681cf27-db80-4fdb-8446-82844110a627'],
    required: false,
    description: 'Array de inteiros',
  })
  @IsArray()
  @IsOptional()
  @IsUUID(4, { each: true })
  idResponsaveis?: string[];

  @ApiProperty({
    example: MOTIVOS_PERDA_ATENDIMENTO.FINANCEIRO_CREDITO,
    enum: MOTIVOS_PERDA_ATENDIMENTO,
    required: false,
    description: 'Motivo da perda do atendimento (obrigatório quando status for perdido)',
  })
  @ValidateIf((o) => o.status === STATUS_ATENDIMENTO.PERDIDO)
  @IsNotEmpty({ message: 'Motivo da perda é obrigatório quando o status for perdido' })
  @IsEnum(MOTIVOS_PERDA_ATENDIMENTO, { message: 'Motivo da perda deve ser um valor válido' })
  @IsOptional()
  motivoPerdido?: MOTIVOS_PERDA_ATENDIMENTO;

  @ApiProperty({
    example: SUB_MOTIVOS_PERDA_ATENDIMENTO.FINANCIAMENTO_NAO_APROVADO,
    enum: SUB_MOTIVOS_PERDA_ATENDIMENTO,
    required: false,
    description: 'Sub motivo específico da perda do atendimento (opcional quando status for perdido)',
  })
  @ValidateIf((o) => o.status === STATUS_ATENDIMENTO.PERDIDO && o.motivoPerdido)
  @IsEnum(SUB_MOTIVOS_PERDA_ATENDIMENTO, { message: 'Sub motivo da perda deve ser um valor válido' })
  @Validate(SubmotivoValidoConstraint)
  @IsOptional()
  subMotivoPerdido?: SUB_MOTIVOS_PERDA_ATENDIMENTO;

  @ApiProperty({ 
    example: ['8681cf27-db80-4fdb-8446-82844110a627', '8681cf27-db80-4fdb-8446-82844110a628'], 
    description: 'Array de IDs das tags a serem vinculadas ao atendimento',
    required: false 
  })
  @IsArray()
  @IsOptional()
  @IsUUID(4, { each: true })
  idTags?: string[];
}
