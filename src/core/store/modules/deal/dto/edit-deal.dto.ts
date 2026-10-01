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
  STATUS_DEAL,
  TEMPERATURE_DEAL,
  REASONS_LOSS_DEAL,
  SUB_REASONS_LOSS_DEAL,
  SUBREASONS_BY_REASON,
  ORIGIN_DEAL,
} from 'src/utils/enum/deal.enum';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'subReasonValid', async: false })
export class SubReasonValidConstraint implements ValidatorConstraintInterface {
  validate(subLostReason: any, args: ValidationArguments) {
    const object = args.object as any;
    const lostReason = object.lostReason;

    if (!lostReason) {
      return true;
    }

    if (!subLostReason) {
      return true;
    }

    const subReasonsValid = SUBREASONS_BY_REASON[lostReason];
    return subReasonsValid && subReasonsValid.includes(subLostReason);
  }

  defaultMessage(args: ValidationArguments) {
    const object = args.object as any;
    const lostReason = object.lostReason;
    const subReasonsValid = SUBREASONS_BY_REASON[lostReason];

    return `The sub-reason selected not is valid for the reason "${lostReason}". SubReasons valid: ${subReasonsValid?.join(', ') || 'none'}`;
  }
}

export class EditDealDto {
  @ApiProperty({ example: 'Deal of test', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ example: 'Description...', required: false })
  @IsOptional()
  @IsString()
  descriptionDeal?: string;

  @ApiProperty({
    example: STATUS_DEAL.SUCCESS,
    enum: STATUS_DEAL,
    required: false,
  })
  @IsOptional()
  @IsEnum(STATUS_DEAL)
  status?: string;

  @ApiProperty({
    example: 'Origin of deal',
    enum: ORIGIN_DEAL,
    required: false,
  })
  @IsOptional()
  @IsEnum(ORIGIN_DEAL)
  dealOrigin?: string;

  @ApiProperty({ example: 'Deal of test', required: false })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({
    example: TEMPERATURE_DEAL.COLD,
    enum: TEMPERATURE_DEAL,
    required: false,
  })
  @IsOptional()
  @IsEnum(TEMPERATURE_DEAL)
  temperature?: TEMPERATURE_DEAL;

  @ApiProperty({
    example: [
      '8681cf27-db80-4fdb-8446-82844110a627',
      '8681cf27-db80-4fdb-8446-82844110a627',
    ],
    required: false,
    description: 'Array of inteiros',
  })
  @IsArray()
  @IsOptional()
  @IsUUID(4, { each: true })
  idAssignees?: string[];

  @ApiProperty({
    example: REASONS_LOSS_DEAL.FINANCIAL_CREDIT,
    enum: REASONS_LOSS_DEAL,
    required: false,
    description: 'Reason of loss of deal (required when status for lost)',
  })
  @ValidateIf((o) => o.status === STATUS_DEAL.LOST)
  @IsNotEmpty({ message: 'Reason of loss is required when o status for lost' })
  @IsEnum(REASONS_LOSS_DEAL, {
    message: 'Reason of loss must be a value valid',
  })
  @IsOptional()
  lostReason?: REASONS_LOSS_DEAL;

  @ApiProperty({
    example: SUB_REASONS_LOSS_DEAL.FINANCING_NOT_APPROVED,
    enum: SUB_REASONS_LOSS_DEAL,
    required: false,
    description:
      'Sub reason specific of loss of deal (optional when status for lost)',
  })
  @ValidateIf((o) => o.status === STATUS_DEAL.LOST && o.lostReason)
  @IsEnum(SUB_REASONS_LOSS_DEAL, {
    message: 'Sub reason of loss must be a value valid',
  })
  @Validate(SubReasonValidConstraint)
  @IsOptional()
  subLostReason?: SUB_REASONS_LOSS_DEAL;

  @ApiProperty({
    example: [
      '8681cf27-db80-4fdb-8446-82844110a627',
      '8681cf27-db80-4fdb-8446-82844110a628',
    ],
    description: 'Array of IDs of tags a be vinculadas to deal',
    required: false,
  })
  @IsArray()
  @IsOptional()
  @IsUUID(4, { each: true })
  idTags?: string[];
}
